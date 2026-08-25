// ============================================================
// HTML REPORT TEMPLATE
// ============================================================
// Renders the report as one self-contained HTML file: inline
// CSS, no CDN, no external assets — renders offline in any
// browser. In --demo mode a fixed-position DEMO DATA watermark
// is stamped across every page.
// ============================================================

import type { ReportData, ProvenanceRow } from "./generate";
import { resolveRate } from "./pricing";

const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const usd = (n: number): string =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const fmtDay = (iso: string): string => iso.slice(0, 10);

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  reviewed: "Reviewed",
  audited: "Audited",
  booked: "Booked",
  closed_won: "Closed (Won)",
  closed_lost: "Closed (Lost)",
};

export const renderHtml = (data: ReportData): string => {
  const { totals, bySource } = data;

  const sourceRows = bySource
    .map((s) => {
      const rate = resolveRate(s.source);
      return `      <tr>
        <td>${esc(s.source ?? "(none)")}${rate.mapped ? "" : ' <span class="unmapped">unmapped</span>'}</td>
        <td>${esc(s.medium ?? "—")}</td>
        <td>${esc(s.campaign ?? "—")}</td>
        <td class="num">${s.lead_count}</td>
        <td class="num">${usd(rate.rate)}</td>
        <td class="num strong">${usd(rate.rate * s.lead_count)}</td>
      </tr>`;
    })
    .join("\n");

  const provRows: ProvenanceRow[] = data.leads;
  const provHtml =
    provRows.length > 0
      ? provRows
          .map(
            (l) => `      <tr>
        <td>${fmtDay(l.created_at)}</td>
        <td>${esc(l.business_name)}</td>
        <td>${esc(l.email)}</td>
        <td>${esc(l.source ?? "(none)")}</td>
        <td>${esc(STATUS_LABELS[l.status] ?? l.status)}</td>
      </tr>`,
          )
          .join("\n")
      : '      <tr><td colspan="5" class="empty">No audit leads recorded for this week.</td></tr>';

  const watermark = data.isDemo
    ? '\n    <div class="watermark" aria-hidden="true">DEMO DATA</div>'
    : "";

  const demoNote = data.isDemo
    ? `<p class="demo-note">This document was generated with <strong>sample data</strong> via <code>--demo</code>. No live lead records are included.</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PPL Weekly Report — ${esc(data.clientName)} — ${esc(data.week)}</title>
<style>
  :root {
    --ink: #1a2233;
    --muted: #5b6472;
    --line: #dde2ea;
    --accent: #0f4c81;
    --accent-soft: #eef4fa;
    --warn-bg: #fdf3e7;
    --warn-ink: #8a5a17;
  }
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: var(--ink);
    margin: 0 auto;
    max-width: 880px;
    padding: 40px 32px 64px;
    background: #ffffff;
    line-height: 1.55;
  }
  header.report-header {
    border-bottom: 3px solid var(--accent);
    padding-bottom: 16px;
    margin-bottom: 28px;
  }
  header.report-header h1 {
    font-size: 26px;
    margin: 0 0 6px;
    letter-spacing: 0.2px;
  }
  header.report-header .meta {
    color: var(--muted);
    font-size: 14px;
    margin: 0;
  }
  h2 {
    font-size: 18px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--accent);
    border-bottom: 1px solid var(--line);
    padding-bottom: 6px;
    margin-top: 36px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    font-size: 13.5px;
  }
  th, td {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid var(--line);
  }
  th {
    background: var(--accent-soft);
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--accent);
  }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.strong { font-weight: 700; }
  tr.total-row td {
    border-top: 2px solid var(--accent);
    border-bottom: none;
    font-weight: 700;
  }
  .kicker {
    display: inline-block;
    background: var(--accent-soft);
    color: var(--accent);
    font-family: -apple-system, sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 3px;
    margin-bottom: 12px;
  }
  .totals-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 18px 0 8px;
  }
  .stat {
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 12px 16px;
  }
  .stat .label {
    font-family: -apple-system, sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--muted);
  }
  .stat .value {
    font-size: 24px;
    font-weight: 700;
    margin-top: 2px;
  }
  footer {
    margin-top: 48px;
    border-top: 1px solid var(--line);
    padding-top: 12px;
    color: var(--muted);
    font-size: 12.5px;
    font-family: -apple-system, sans-serif;
  }
  .demo-note {
    background: var(--warn-bg);
    color: var(--warn-ink);
    border: 1px solid #f0d9b8;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 13.5px;
  }
  .watermark {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 9999;
    font-size: 96px;
    font-weight: 800;
    letter-spacing: 12px;
    color: rgba(220, 38, 38, 0.09);
    transform: rotate(-24deg);
    user-select: none;
    white-space: nowrap;
  }
  @media print {
    body { padding: 24px; }
    .watermark { position: fixed; }
  }
</style>
</head>
<body>
  <div class="kicker">Pay-Per-Lead · Weekly Client Report</div>${watermark}
  <header class="report-header">
    <h1>${esc(data.clientName)}</h1>
    <p class="meta">
      Week ${esc(data.week)}
      &nbsp;·&nbsp; Generated ${esc(data.generatedAt.slice(0, 10))}
      &nbsp;·&nbsp; Arkansas Automated
    </p>
  </header>
  ${demoNote}

  <h2>Summary</h2>
  <div class="totals-grid">
    <div class="stat"><div class="label">Total Leads</div><div class="value">${totals.leads}</div></div>
    <div class="stat"><div class="label">Blended Rate</div><div class="value">${usd(totals.amountDue / Math.max(totals.leads, 1))}</div></div>
    <div class="stat"><div class="label">Amount Due</div><div class="value">${usd(totals.amountDue)}</div></div>
  </div>

  <h2>Leads by Source</h2>
  <table>
    <thead>
      <tr>
        <th>Source</th><th>Medium</th><th>Campaign</th>
        <th class="num">Leads</th><th class="num">Rate</th><th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
${sourceRows}
      <tr class="total-row">
        <td colspan="3">Total</td>
        <td class="num">${totals.leads}</td>
        <td class="num"></td>
        <td class="num">${usd(totals.amountDue)}</td>
      </tr>
    </tbody>
  </table>

  <h2>Lead Provenance</h2>
  <table>
    <thead>
      <tr><th>Date</th><th>Business</th><th>Contact</th><th>Source</th><th>Status</th></tr>
    </thead>
    <tbody>
${provHtml}
    </tbody>
  </table>

  <footer>
    Every figure above is computed directly from recorded lead rows (audit_leads,
    lead_sources) and the per-source rate table in scripts/ppl-report/pricing.ts.
    Questions: Arkansas Automated.
  </footer>
</body>
</html>
`;
};
