import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repo = process.cwd();
const outputDirectory = path.join(repo, "qa", "ai");
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const baseUrl = process.env.AI_QA_BASE_URL || "http://127.0.0.1:3000";
const debuggingPort = Number(process.env.AI_QA_DEBUG_PORT || 9335);
const profileDirectory = mkdtempSync(path.join(tmpdir(), "bespoke-ai-edge-"));
mkdirSync(outputDirectory, { recursive: true });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result ?? {});
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { method, resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
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
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result?.value;
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

async function navigate(client, url) {
  await client.send("Page.navigate", { url });
  await delay(1_400);
}

async function capture(client, filename) {
  const result = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const outputPath = path.join(outputDirectory, filename);
  writeFileSync(outputPath, Buffer.from(result.data, "base64"));
  return outputPath;
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
  const targetResponse = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?${encodeURIComponent(`${baseUrl}/bespoke-ai`)}`, { method: "PUT" });
  if (!targetResponse.ok) throw new Error(`Could not create the Edge QA target: ${targetResponse.status}`);
  const target = await targetResponse.json();
  client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();

  const consoleErrors = [];
  client.socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text || "Runtime exception");
    if (message.method === "Log.entryAdded" && ["error", "warning"].includes(message.params.entry.level)) {
      consoleErrors.push(`${message.params.entry.level}: ${message.params.entry.text}`);
    }
  });

  await Promise.all([
    client.send("Page.enable"),
    client.send("Runtime.enable"),
    client.send("Log.enable"),
    client.send("Network.enable"),
    client.send("Network.setCacheDisabled", { cacheDisabled: true }),
  ]);

  const results = { browser: "Microsoft Edge", baseUrl, capturedAt: new Date().toISOString(), checks: {}, screenshots: [] };
  await setViewport(client, 752, 564);
  await navigate(client, `${baseUrl}/bespoke-ai`);
  results.checks.desktopNoHorizontalOverflow = await evaluate(client, "Math.round(document.body.getBoundingClientRect().width) <= window.innerWidth");
  results.checks.exactlyThreeQuickStarts = await evaluate(client, "document.querySelectorAll('[data-bespoke-ai-quick-start]').length === 3");
  results.checks.composerVisible = await evaluate(client, "document.querySelector('[data-bespoke-ai-composer]')?.checkVisibility() === true");
  results.checks.primaryInputLabel = await evaluate(client, "Boolean(document.querySelector('[data-bespoke-ai-chat-input=true]')?.labels?.length)");
  results.checks.greetingVisible = await evaluate(client, "document.body.textContent.includes('Ready to build the big idea?')");
  results.layout = await evaluate(client, `(() => {
    const box = (selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect && { top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height) };
    };
    return { viewport: { width: innerWidth, height: innerHeight }, header: box('section[aria-labelledby=\"bespoke-ai-panel-title\"] header'), emptyState: box('[data-bespoke-ai-empty-state]'), content: box('[data-bespoke-ai-empty-content]'), composer: box('[data-bespoke-ai-composer]'), documentScrollTop: document.documentElement.scrollTop };
  })()`);
  results.screenshots.push(await capture(client, "bespoke-ai-empty-desktop.png"));
  await evaluate(client, "document.querySelector('[data-bespoke-ai-chat-input=true]').focus()");
  await client.send("Input.insertText", { text: "I have a new product idea" });
  results.checks.inputAcceptsText = await evaluate(client, "document.querySelector('[data-bespoke-ai-chat-input=true]').value === 'I have a new product idea'");
  await evaluate(client, `(() => {
    const input = document.querySelector('[data-bespoke-ai-chat-input=true]');
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);

  await setViewport(client, 390, 844, true);
  await delay(350);
  results.checks.mobileNoHorizontalOverflow = await evaluate(client, "document.documentElement.scrollWidth <= window.innerWidth");
  results.checks.mobileComposerVisible = await evaluate(client, "document.querySelector('[data-bespoke-ai-composer]')?.checkVisibility() === true");
  results.screenshots.push(await capture(client, "bespoke-ai-empty-mobile.png"));

  await setViewport(client, 1365, 768);
  await navigate(client, `${baseUrl}/`);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await evaluate(client, "document.querySelector('[aria-label=\"Ask Bespoke AI for a build recommendation\"]')?.click()");
    await delay(250);
    if (await evaluate(client, "Boolean(document.querySelector('aside[aria-label=\"Bespoke AI side panel\"]'))")) break;
  }
  results.checks.opensDockedByDefault = await evaluate(client, "Boolean(document.querySelector('aside[aria-label=\"Bespoke AI side panel\"]') && document.body.classList.contains('bespoke-ai-side-panel-open'))");
  results.checks.dockedWidthIsUsable = await evaluate(client, `(() => {
    const width = document.querySelector('aside[aria-label="Bespoke AI side panel"]')?.getBoundingClientRect().width;
    return Boolean(width && width >= 360 && width <= 560);
  })()`);
  results.checks.heroSupportClearsPhones = await evaluate(client, `(() => {
    const stage = document.querySelector('[data-hero-phone-stage="desktop"]')?.getBoundingClientRect();
    const support = document.querySelector('[data-home-hero-support="true"]')?.getBoundingClientRect();
    return Boolean(stage && support && support.top >= stage.bottom);
  })()`);
  results.screenshots.push(await capture(client, "bespoke-ai-docked-desktop.png"));
  await evaluate(client, "document.querySelector('[aria-label=\"Detach Bespoke AI panel\"]')?.click()");
  await delay(300);
  results.checks.detachesToFloatingPanel = await evaluate(client, `(() => {
    const panel = document.querySelector('aside[aria-label="Bespoke AI floating panel"]')?.getBoundingClientRect();
    return Boolean(panel && panel.width >= 360 && panel.width <= 500 && panel.height >= 460 && panel.bottom <= innerHeight);
  })()`);
  results.screenshots.push(await capture(client, "bespoke-ai-floating-desktop.png"));
  results.checks.navigationTargetFound = await evaluate(client, "Boolean(document.querySelector('header a[href=\"/contact\"]'))");
  await evaluate(client, "window.location.assign('/contact')");
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await delay(400);
    if (await evaluate(client, "location.pathname === '/contact' && Boolean(document.querySelector('aside[aria-label=\"Bespoke AI floating panel\"]'))")) break;
  }
  results.navigationState = await evaluate(client, `({
    pathname: location.pathname,
    hasFloatingPanel: Boolean(document.querySelector('aside[aria-label="Bespoke AI floating panel"]')),
    hasDockedPanel: Boolean(document.querySelector('aside[aria-label="Bespoke AI side panel"]')),
    savedPanelState: sessionStorage.getItem("bespoke-ai-panel-state")
  })`);
  results.checks.followsPublicNavigation = await evaluate(client, "location.pathname === '/contact' && Boolean(document.querySelector('aside[aria-label=\"Bespoke AI floating panel\"]'))");
  await evaluate(client, "document.querySelector('[aria-label=\"Dock Bespoke AI to the side\"]')?.click()");
  await delay(250);
  results.checks.snapsBackToSide = await evaluate(client, "Boolean(document.querySelector('aside[aria-label=\"Bespoke AI side panel\"]'))");
  results.consoleErrors = consoleErrors;
  results.checks.noConsoleErrors = !consoleErrors.some((entry) => !entry.startsWith("warning:"));
  results.checks.allPassed = Object.entries(results.checks).every(([key, value]) => key === "allPassed" || value === true);
  writeFileSync(path.join(outputDirectory, "browser-qa.json"), `${JSON.stringify(results, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  if (!results.checks.allPassed) process.exitCode = 1;
} finally {
  client?.close();
  edge.kill();
  try {
    rmSync(profileDirectory, { recursive: true, force: true });
  } catch {
    // Edge can briefly retain profile files on Windows.
  }
}
