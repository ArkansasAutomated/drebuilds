import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const HOST = "https://www.drebuilds.online";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function parseSeoPages(source) {
  const pages = [];
  const blocks = [
    { marker: "export const locationPages", prefix: "/arkansas/" },
    { marker: "export const servicePages", prefix: "/services/" },
  ];
  for (const { marker, prefix } of blocks) {
    const start = source.indexOf(marker);
    if (start < 0) throw new Error(`missing ${marker}`);
    const slice = source.slice(start, source.indexOf("];", start) + 2);
    const re =
      /slug:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?description:\s*"([^"]+)"[\s\S]*?intro:\s*"([^"]+)"/g;
    let match;
    while ((match = re.exec(slice))) {
      pages.push({
        path: `${prefix}${match[1]}`,
        title: match[2],
        description: match[3],
        intro: match[4],
      });
    }
  }
  return pages;
}

export function publicRoutes(seoPages) {
  return [
    {
      path: "/",
      title: "AI Automation for Arkansas Businesses | DREBUILDS",
      description:
        "DREBUILDS builds practical AI agents and workflow automation for Arkansas businesses. Automate lead follow-up, documents, reporting, scheduling, and operations.",
      intro:
        "DREBUILDS builds practical AI agents and workflow automation for Arkansas businesses.",
      h1: "AI Automation for Arkansas Businesses",
    },
    {
      path: "/audit",
      title: "Free Automation Audit | DREBUILDS",
      description:
        "Request a free automation audit from DREBUILDS. We map repetitive work, estimate impact, and recommend the first workflow worth automating.",
      intro:
        "Start with a free automation audit. DREBUILDS maps the handoffs slowing your Arkansas business down and recommends the first workflow worth automating.",
      h1: "Free Automation Audit",
    },
    ...seoPages.map((page) => ({
      ...page,
      h1: page.title,
    })),
  ];
}

export function applyRouteToHtml(html, route) {
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const canonical = `${HOST}${route.path === "/" ? "/" : route.path}`;
  const h1 = escapeHtml(route.h1 || route.title);
  const intro = escapeHtml(route.intro);
  let next = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  next = next.replace(
    /(<link rel="canonical" href=")[^"]*(")/i,
    `$1${canonical}$2`,
  );
  next = next.replace(
    /(<meta property="og:title" content=")[^"]*(")/i,
    `$1${title}$2`,
  );
  next = next.replace(
    /(<meta property="og:description" content=")[^"]*(")/i,
    `$1${description}$2`,
  );
  next = next.replace(
    /(<meta property="og:url" content=")[^"]*(")/i,
    `$1${canonical}$2`,
  );
  next = next.replace(
    /(<meta name="twitter:title" content=")[^"]*(")/i,
    `$1${title}$2`,
  );
  next = next.replace(
    /(<meta name="twitter:description" content=")[^"]*(")/i,
    `$1${description}$2`,
  );
  next = next.replace(
    /(<meta name="description" content=")[^"]*(")/i,
    `$1${description}$2`,
  );
  const ssr = `<div id="root"><main><h1>${h1}</h1><p>${intro}</p></main></div>`;
  next = next.replace(/<div id="root"><\/div>/i, ssr);
  return next;
}

export function notFoundHtml(html) {
  return applyRouteToHtml(html, {
    path: "/404",
    title: "Page not found | DREBUILDS",
    description: "That page does not exist on DREBUILDS.",
    intro: "The page you requested is not a public DREBUILDS route.",
    h1: "404",
  }).replace(
    "<head>",
    '<head>\n    <meta name="robots" content="noindex, nofollow" />',
  );
}

export function writePrerenderedRoutes({ distDir, seoSource, indexHtml }) {
  const routes = publicRoutes(parseSeoPages(seoSource));
  const written = [];
  for (const route of routes) {
    const html = applyRouteToHtml(indexHtml, route);
    const outFile =
      route.path === "/"
        ? path.join(distDir, "index.html")
        : path.join(distDir, route.path.replace(/^\//, ""), "index.html");
    mkdirSync(path.dirname(outFile), { recursive: true });
    writeFileSync(outFile, html);
    written.push(route.path);
  }
  writeFileSync(path.join(distDir, "404.html"), notFoundHtml(indexHtml));
  return written;
}

function isMain() {
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return entry.endsWith(`${path.sep}prerender-html.mjs`);
}

if (isMain()) {
  const root = process.cwd();
  const distDir = path.join(root, "dist");
  const indexHtml = readFileSync(path.join(distDir, "index.html"), "utf8");
  const seoSource = readFileSync(path.join(root, "src/data/seoPages.ts"), "utf8");
  const written = writePrerenderedRoutes({ distDir, seoSource, indexHtml });
  console.log(`prerendered ${written.length} routes`);
}
