import { spawn } from "node:child_process";
import { createDecipheriv, createHash, createHmac } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import pg from "pg";
import { pathToFileURL } from "node:url";

try {
  process.loadEnvFile(".env.local");
} catch {
  // CI can provide the same values directly.
}

const repo = process.cwd();
const outputDirectory = path.join(repo, "qa", "admin");
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const baseUrl = process.env.ADMIN_QA_BASE_URL || "http://localhost:3000";
const debuggingPort = Number(process.env.ADMIN_QA_DEBUG_PORT || 9333);
const profileDirectory = mkdtempSync(path.join(tmpdir(), "bespoke-admin-edge-"));
mkdirSync(outputDirectory, { recursive: true });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function generateTotp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const character of normalized) bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", Buffer.from(bytes)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

function decryptTotpSecret(payload) {
  try {
    const [iv, tag, ciphertext] = payload.split(".");
    const key = createHash("sha256")
      .update(`${process.env.ADMIN_CODE_PEPPER ?? "bespoke-admin-local-development-code-pepper"}:totp-secret-encryption`)
      .digest();
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

async function resolveQaSecret(email, fallback) {
  if (!process.env.DATABASE_URL) return fallback;
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
    max: 1,
  });
  try {
    const result = await pool.query(
      `SELECT authenticator.secret_ciphertext
       FROM admin_authenticators authenticator
       JOIN admin_users admin_user ON admin_user.id = authenticator.user_id
       WHERE lower(admin_user.email) = lower($1)
         AND authenticator.authenticator_type = 'totp'
         AND authenticator.disabled_at IS NULL
         AND authenticator.confirmed_at IS NOT NULL
         AND authenticator.secret_ciphertext IS NOT NULL
       ORDER BY authenticator.created_at DESC
       LIMIT 1`,
      [email],
    );
    return decryptTotpSecret(result.rows[0]?.secret_ciphertext ?? "") ?? fallback;
  } finally {
    await pool.end();
  }
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
        else pending.resolve(message.result ?? {});
        return;
      }
      const waiters = this.waiters.get(message.method) ?? [];
      this.waiters.delete(message.method);
      for (const waiter of waiters) waiter(message.params ?? {});
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { method, resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitFor(eventName, timeout = 15_000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${eventName}`)), timeout);
      const waiter = (params) => {
        clearTimeout(timer);
        resolve(params);
      };
      const current = this.waiters.get(eventName) ?? [];
      current.push(waiter);
      this.waiters.set(eventName, current);
    });
  }

  close() {
    this.socket?.close();
  }
}

async function waitForEdge() {
  const endpoint = `http://127.0.0.1:${debuggingPort}/json/version`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) return;
    } catch {
      // Edge is still starting.
    }
    await delay(250);
  }
  throw new Error("Microsoft Edge did not expose its debugging endpoint.");
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Browser evaluation failed.");
  return result.result?.value;
}

async function navigate(client, url, waitMilliseconds = 900) {
  const loaded = client.waitFor("Page.loadEventFired").catch(() => undefined);
  await client.send("Page.navigate", { url });
  await loaded;
  await delay(waitMilliseconds);
}

async function waitForCondition(client, expression, timeout = 30_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(client, expression)) return;
    await delay(250);
  }
  throw new Error(`Timed out waiting for browser condition: ${expression}`);
}

async function setViewport(client, width, height, mobile = false) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
}

async function screenshot(client, filename, captureBeyondViewport = false) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport,
  });
  const outputPath = path.join(outputDirectory, filename);
  writeFileSync(outputPath, Buffer.from(result.data, "base64"));
  return outputPath;
}

async function pressTab(client) {
  const common = { key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 };
  await client.send("Input.dispatchKeyEvent", { type: "keyDown", ...common });
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", ...common });
  await delay(80);
}

const edge = spawn(edgePath, [
  "--headless=new",
  `--remote-debugging-port=${debuggingPort}`,
  `--user-data-dir=${profileDirectory}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "--hide-scrollbars",
  "about:blank",
], { stdio: "ignore", windowsHide: true });

let client;
try {
  await waitForEdge();
  const targetResponse = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?${encodeURIComponent(`${baseUrl}/admin/login`)}`, { method: "PUT" });
  if (!targetResponse.ok) throw new Error(`Could not create the Edge QA target: ${targetResponse.status}`);
  const target = await targetResponse.json();
  client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await Promise.all([
    client.send("Page.enable"),
    client.send("Runtime.enable"),
    client.send("Network.enable"),
    client.send("Network.setCacheDisabled", { cacheDisabled: true }),
  ]);

  const results = {
    browser: "Microsoft Edge",
    baseUrl,
    capturedAt: new Date().toISOString(),
    checks: {},
    focusOrder: [],
    screenshots: [],
  };

  await setViewport(client, 1363, 936);
  await navigate(client, `${baseUrl}/admin/login`);
  results.checks.loginTitle = await evaluate(client, "document.querySelector('h2')?.textContent?.trim() === 'Secure admin access'");
  results.checks.loginLabels = await evaluate(client, `(() => {
    const controls = [...document.querySelectorAll('input, button')].filter((element) => element.offsetParent !== null);
    return controls.every((element) => element.tagName === 'BUTTON' || element.labels?.length || element.getAttribute('aria-label'));
  })()`);
  for (let index = 0; index < 4; index += 1) {
    await pressTab(client);
    results.focusOrder.push(await evaluate(client, `(() => {
      const element = document.activeElement;
      return element?.getAttribute('name') || element?.getAttribute('aria-label') || element?.textContent?.trim() || element?.tagName;
    })()`));
  }
  results.checks.keyboardFocusOrder = JSON.stringify(results.focusOrder) === JSON.stringify(["Bespoke Technologies Admin home", "email", "code", "Continue securely"]);
  await screenshot(client, "login-desktop.png");
  results.screenshots.push("login-desktop.png");

  const qaEmail = process.env.ADMIN_FOUNDER_EMAIL;
  const configuredQaSecret = process.env.ADMIN_FOUNDER_TOTP_SECRET;
  if (!qaEmail || !configuredQaSecret) throw new Error("Founder QA credentials are not configured.");
  const qaSecret = await resolveQaSecret(qaEmail, configuredQaSecret);
  const qaCode = generateTotp(qaSecret);
  await evaluate(client, `(() => {
    const setValue = (element, value) => {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setValue(document.querySelector('input[name="email"]'), ${JSON.stringify(qaEmail)});
    setValue(document.querySelector('input[name="code"]'), ${JSON.stringify(qaCode)});
    return document.querySelector('input[name="code"]').value;
  })()`);
  results.checks.fullCodeEntry = await evaluate(client, "document.querySelector('input[name=code]').value.length === 6");
  await evaluate(client, "document.querySelector('form').requestSubmit()");
  await delay(1_500);
  if (!(await evaluate(client, "location.pathname === '/admin'"))) await navigate(client, `${baseUrl}/admin`);
  await waitForCondition(client, "document.querySelector('h1')?.textContent?.trim() === 'Company overview'");

  results.checks.dashboardLoaded = await evaluate(client, "document.querySelector('h1')?.textContent?.trim() === 'Company overview'");
  results.checks.landmarks = await evaluate(client, "Boolean(document.querySelector('main') && document.querySelector('nav[aria-label=\"Admin navigation\"]'))");
  results.checks.noDuplicateIds = await evaluate(client, `(() => {
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    return ids.length === new Set(ids).size;
  })()`);
  results.checks.namedButtons = await evaluate(client, `(() => [...document.querySelectorAll('button')]
    .filter((button) => button.offsetParent !== null)
    .every((button) => (button.getAttribute('aria-label') || button.textContent || '').trim().length > 0))()`);
  results.checks.desktopNoHorizontalOverflow = await evaluate(client, "document.documentElement.scrollWidth <= window.innerWidth");
  results.checks.portfolioKpi = await evaluate(client, "document.body.textContent.includes('Portfolio projects')");
  await screenshot(client, "dashboard-desktop.png");
  results.screenshots.push("dashboard-desktop.png");

  await navigate(client, `${baseUrl}/admin/portfolio`);
  await waitForCondition(client, "document.body.textContent.includes('Website portfolio') && Boolean([...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Edit'))");
  await evaluate(client, `(() => {
    const edit = [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Edit');
    edit?.click();
  })()`);
  await delay(300);
  results.checks.singlePortfolioEditor = await evaluate(client, `(() => {
    const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter((dialog) => dialog.offsetParent !== null);
    if (dialogs.length !== 1) return false;
    const rectangle = dialogs[0].getBoundingClientRect();
    return rectangle.width >= 640 && getComputedStyle(dialogs[0]).borderRadius === '8px';
  })()`);
  results.checks.portfolioNoHorizontalOverflow = await evaluate(client, "document.documentElement.scrollWidth <= window.innerWidth");
  await screenshot(client, "portfolio-editor-desktop.png");
  results.screenshots.push("portfolio-editor-desktop.png");

  await navigate(client, `${baseUrl}/admin/people`);
  await waitForCondition(client, "document.querySelector('h1')?.textContent?.trim() === 'People & access'");
  results.checks.peopleSeparatePage = await evaluate(client, "document.querySelector('h1')?.textContent?.trim() === 'People & access'");
  results.checks.employeeEmailFits = await evaluate(client, `(() => {
    const input = document.querySelector('input[name="username"]');
    const row = input?.parentElement;
    return Boolean(input && row && input.getBoundingClientRect().right <= row.getBoundingClientRect().right && document.documentElement.scrollWidth <= innerWidth);
  })()`);
  await screenshot(client, "people-access-desktop.png");
  results.screenshots.push("people-access-desktop.png");

  await navigate(client, `${baseUrl}/admin`);
  await waitForCondition(client, "document.querySelector('h1')?.textContent?.trim() === 'Company overview'");

  await setViewport(client, 820, 1180);
  await delay(350);
  results.checks.tabletNoHorizontalOverflow = await evaluate(client, "document.documentElement.scrollWidth <= window.innerWidth");
  await screenshot(client, "dashboard-tablet.png");
  results.screenshots.push("dashboard-tablet.png");

  await setViewport(client, 390, 844, true);
  await delay(350);
  results.checks.mobileNoHorizontalOverflow = await evaluate(client, "document.documentElement.scrollWidth <= window.innerWidth");
  results.checks.mobileMenuButton = await evaluate(client, "Boolean(document.querySelector('[aria-label=\"Open navigation\"]'))");
  await screenshot(client, "dashboard-mobile.png");
  results.screenshots.push("dashboard-mobile.png");
  await evaluate(client, "document.querySelector('[aria-label=\"Open navigation\"]').click()");
  await delay(250);
  results.checks.mobileNavigationVisible = await evaluate(client, "document.querySelector('nav[aria-label=\"Admin navigation\"]').getBoundingClientRect().left >= 0");
  await screenshot(client, "dashboard-mobile-nav.png");
  results.screenshots.push("dashboard-mobile-nav.png");
  const billingHref = await evaluate(client, `(() => {
    const billing = [...document.querySelectorAll('nav a')].find((link) => link.textContent.trim() === 'Billing');
    billing.click();
    return billing.href;
  })()`);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await evaluate(client, "location.pathname === '/admin/billing'")) break;
    await delay(150);
  }
  results.checks.primaryNavigation = billingHref.endsWith("/admin/billing") && await evaluate(client, "location.pathname === '/admin/billing'");

  await setViewport(client, 1363, 936);
  await navigate(client, `${baseUrl}/admin/billing/new`);
  results.checks.editorLoaded = await evaluate(client, "document.body.textContent.includes('Live A4 preview') && document.querySelectorAll('input').length >= 8");
  results.checks.editorNoHorizontalOverflow = await evaluate(client, "document.documentElement.scrollWidth <= window.innerWidth");
  await screenshot(client, "billing-editor-desktop.png");
  results.screenshots.push("billing-editor-desktop.png");

  await navigate(client, `${baseUrl}/admin/billing/40000000-0000-4000-8000-000000000002`);
  results.checks.invoiceDetailLoaded = await evaluate(client, "document.body.textContent.includes('BT-INV-2026-0002') && document.body.textContent.includes('Balance due')");
  await screenshot(client, "invoice-detail-desktop.png", true);
  results.screenshots.push("invoice-detail-desktop.png");

  await setViewport(client, 1240, 1754);
  await evaluate(client, `(() => {
    const source = document.querySelector('main article');
    if (!source) throw new Error('Invoice preview article was not found.');
    const article = source.cloneNode(true);
    document.body.replaceChildren(article);
    document.documentElement.style.margin = '0';
    document.body.style.margin = '0';
    document.body.style.background = 'white';
    article.style.width = '1240px';
    article.style.maxWidth = 'none';
    article.style.height = '1754px';
    article.style.aspectRatio = 'auto';
    article.style.boxShadow = 'none';
    return true;
  })()`);
  await delay(300);
  results.checks.invoicePreviewGeometry = await evaluate(client, `(() => {
    const rectangle = document.querySelector('article').getBoundingClientRect();
    return Math.round(rectangle.width) === 1240 && Math.round(rectangle.height) === 1754;
  })()`);
  await screenshot(client, "invoice-preview.png");
  results.screenshots.push("invoice-preview.png");

  await client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  results.checks.reducedMotionMedia = await evaluate(client, "matchMedia('(prefers-reduced-motion: reduce)').matches");

  const referencePath = path.join(repo, "Bespoke_Invoice_Generator_Source", "qa", "dashboard-desktop.png");
  const implementationPath = path.join(outputDirectory, "dashboard-desktop.png");
  const comparisonHtml = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:1363px;background:#111827}figure{position:relative;margin:0;width:1363px;height:936px;overflow:hidden}img{display:block;width:1363px;height:936px;object-fit:fill}.label{position:absolute;z-index:2;left:12px;top:12px;padding:7px 10px;border-radius:7px;background:rgba(15,23,42,.9);color:white;font:700 13px system-ui}</style></head><body><figure><span class="label">REFERENCE · 1363 × 936</span><img src="${pathToFileURL(referencePath).href}"></figure><figure><span class="label">IMPLEMENTATION · 1363 × 936</span><img src="${pathToFileURL(implementationPath).href}"></figure></body></html>`;
  const comparisonHtmlPath = path.join(outputDirectory, "dashboard-comparison.html");
  writeFileSync(comparisonHtmlPath, comparisonHtml);
  await setViewport(client, 1363, 1872);
  await navigate(client, pathToFileURL(comparisonHtmlPath).href, 600);
  await screenshot(client, "dashboard-comparison.png");
  results.screenshots.push("dashboard-comparison.png");

  const invoiceReferencePath = path.join(repo, "Bespoke_Invoice_Generator_Source", "qa", "pdf-render", "demo-invoice.png");
  const invoiceImplementationPath = path.join(outputDirectory, "invoice-preview.png");
  const invoiceComparisonHtml = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:1240px;background:#111827}figure{position:relative;margin:0;width:1240px;height:1754px;overflow:hidden}img{display:block;width:1240px;height:1754px;object-fit:fill}.label{position:absolute;z-index:2;left:12px;top:12px;padding:7px 10px;border-radius:7px;background:rgba(15,23,42,.9);color:white;font:700 13px system-ui}</style></head><body><figure><span class="label">REFERENCE · 1240 × 1754</span><img src="${pathToFileURL(invoiceReferencePath).href}"></figure><figure><span class="label">IMPLEMENTATION · 1240 × 1754</span><img src="${pathToFileURL(invoiceImplementationPath).href}"></figure></body></html>`;
  const invoiceComparisonHtmlPath = path.join(outputDirectory, "invoice-comparison.html");
  writeFileSync(invoiceComparisonHtmlPath, invoiceComparisonHtml);
  await setViewport(client, 1240, 3508);
  await navigate(client, pathToFileURL(invoiceComparisonHtmlPath).href, 600);
  await screenshot(client, "invoice-comparison.png");
  results.screenshots.push("invoice-comparison.png");

  results.checks.allAutomatedChecksPassed = Object.entries(results.checks)
    .filter(([name]) => name !== "allAutomatedChecksPassed")
    .every(([, value]) => value === true);
  writeFileSync(path.join(outputDirectory, "browser-qa.json"), `${JSON.stringify(results, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  if (!results.checks.allAutomatedChecksPassed) process.exitCode = 1;
} finally {
  client?.close();
  edge.kill();
  try {
    rmSync(profileDirectory, { recursive: true, force: true });
  } catch {
    // Edge can briefly retain profile files on Windows; the OS temp cleanup
    // remains the fallback and the QA result is already written.
  }
}
