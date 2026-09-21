import { describe, expect, it } from "vitest";
import {
  contactNotificationEmail,
  digitalAuditReportEmail,
  ideaExecutionGateReportEmail,
} from "./transactional";

/**
 * Returns every `<tr>` whose nearest open container is a `<td>` rather than a
 * `<table>`. Email clients repair that markup by hoisting the row into the
 * layout table, which collapses the entire email into a narrow column.
 */
function strayTableRows(html: string) {
  const stack: string[] = [];
  const stray: number[] = [];
  for (const match of html.matchAll(/<(\/?)(table|tr|td)\b[^>]*>/gi)) {
    const [, closing, rawTag] = match;
    const tag = rawTag.toLowerCase();
    if (closing) {
      const index = stack.lastIndexOf(tag);
      if (index >= 0) stack.length = index;
      continue;
    }
    if (tag === "tr") {
      const container = [...stack].reverse().find((open) => open === "table" || open === "td");
      if (container !== "table") stray.push(match.index ?? -1);
    }
    stack.push(tag);
  }
  return stray;
}

const auditInput = {
  businessName: "Northstar Services",
  score: 50,
  tier: "Operational",
  interpretation: "Core work is digitally supported.",
  dimensions: [
    { label: "Digital Presence & Conversion", score: 100 },
    { label: "Data & Reporting", score: 0 },
    { label: "Lead Management", score: 33 },
  ],
  priorities: [
    { area: "Data & Reporting", title: "Create one source of operational truth", move: "Consolidate key records." },
    { area: "Lead Management", title: "Systematise enquiry follow-up", move: "Capture every enquiry." },
  ],
  reportUrl: "https://www.bespoketech.com.ng/digital-readiness-audit/report/example",
};

describe("email table structure", () => {
  it("detects a bare row, so the guard itself is trustworthy", () => {
    expect(strayTableRows("<table><tr><td><tr><td>x</td></tr></td></tr></table>")).toHaveLength(1);
    expect(strayTableRows("<table><tr><td><table><tr><td>x</td></tr></table></td></tr></table>")).toHaveLength(0);
  });

  it("never nests a bare table row inside a cell", () => {
    const emails = {
      audit: digitalAuditReportEmail(auditInput),
      ideaGate: ideaExecutionGateReportEmail({
        ideaTitle: "Clinic Scheduler",
        totalScore: 16,
        maxScore: 20,
        gatesPassed: 8,
        decisionLabel: "Green",
        reportUrl: "https://www.bespoketech.com.ng/idea-execution-gate/report/example",
      }),
      contact: contactNotificationEmail({
        name: "Ada",
        email: "ada@example.com",
        service: "Web",
        message: "Hello",
      }),
    };
    for (const [name, email] of Object.entries(emails)) {
      expect(strayTableRows(email.html), `${name} email has a stray <tr>`).toEqual([]);
    }
  });
});

describe("digitalAuditReportEmail", () => {
  it("uses the current product name, not the retired one", () => {
    const email = digitalAuditReportEmail(auditInput);
    expect(email.subject).toBe("Your Bespoke Business Audit report — Northstar Services");
    expect(email.html).not.toMatch(/Digital Readiness/);
    expect(email.text).not.toMatch(/Digital Readiness/);
  });

  it("carries the score, every dimension, the priorities and the report link", () => {
    const email = digitalAuditReportEmail(auditInput);
    for (const part of [email.html, email.text]) {
      expect(part).toContain("50");
      expect(part).toContain("Operational");
      for (const dimension of auditInput.dimensions) expect(part).toContain(dimension.label.replace("&", part === email.html ? "&amp;" : "&"));
      for (const priority of auditInput.priorities) expect(part).toContain(priority.title);
      expect(part).toContain(auditInput.reportUrl);
    }
  });

  it("omits the priorities section when there are none", () => {
    const email = digitalAuditReportEmail({ ...auditInput, priorities: [] });
    expect(email.html).not.toContain("Where to focus first");
    expect(email.text).not.toContain("WHERE TO FOCUS FIRST");
  });

  it("escapes user-controlled business names", () => {
    const email = digitalAuditReportEmail({
      ...auditInput,
      businessName: '<img src=x onerror="alert(1)">',
    });
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;img src=x");
  });
});
