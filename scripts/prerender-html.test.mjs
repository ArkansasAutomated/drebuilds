import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyRouteToHtml,
  parseSeoPages,
  publicRoutes,
  writePrerenderedRoutes,
} from "./prerender-html.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const seoSource = readFileSync(path.join(root, "src/data/seoPages.ts"), "utf8");
const shell = `<!doctype html><html><head>
<title>AI Automation for Arkansas Businesses | DREBUILDS</title>
<meta name="description" content="home desc" />
<link rel="canonical" href="https://www.drebuilds.online/" />
<meta property="og:title" content="home" />
<meta property="og:description" content="home" />
<meta property="og:url" content="https://www.drebuilds.online/" />
<meta name="twitter:title" content="home" />
<meta name="twitter:description" content="home" />
</head><body><div id="root"></div></body></html>`;

test("parses location and service pages from seoPages.ts", () => {
  const pages = parseSeoPages(seoSource);
  assert.equal(pages.length, 13);
  assert.ok(pages.some((p) => p.path === "/arkansas/fort-smith" && p.title.includes("Fort Smith")));
  assert.ok(pages.some((p) => p.path === "/services/ai-agents"));
});

test("injects unique title canonical h1 and body", () => {
  const html = applyRouteToHtml(shell, {
    path: "/audit",
    title: "Free Automation Audit | DREBUILDS",
    description: "Request a free automation audit",
    intro: "Start with a free automation audit.",
    h1: "Free Automation Audit",
  });
  assert.match(html, /<title>Free Automation Audit \| DREBUILDS<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/www\.drebuilds\.online\/audit"/);
  assert.match(html, /<h1>Free Automation Audit<\/h1>/);
  assert.match(html, /Start with a free automation audit/);
  assert.doesNotMatch(html, /rel="canonical" href="https:\/\/www\.drebuilds\.online\/"/);
});

test("writes one html file per public route plus 404.html", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "dre-160-"));
  try {
    writeFileSync(path.join(dir, "index.html"), shell);
    const written = writePrerenderedRoutes({
      distDir: dir,
      seoSource,
      indexHtml: shell,
    });
    assert.equal(written.length, publicRoutes(parseSeoPages(seoSource)).length);
    const audit = readFileSync(path.join(dir, "audit/index.html"), "utf8");
    const fort = readFileSync(path.join(dir, "arkansas/fort-smith/index.html"), "utf8");
    const missing = readFileSync(path.join(dir, "404.html"), "utf8");
    assert.match(audit, /canonical" href="https:\/\/www\.drebuilds\.online\/audit"/);
    assert.match(fort, /Fort Smith/);
    assert.match(missing, /noindex, nofollow/);
    assert.notEqual(
      readFileSync(path.join(dir, "services/ai-agents/index.html"), "utf8").match(/<title>(.*?)<\/title>/)[1],
      readFileSync(path.join(dir, "audit/index.html"), "utf8").match(/<title>(.*?)<\/title>/)[1],
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
