// Minimal front-matter parser + markdown renderer for the PSEO blog.
// Zero dependencies by design: the articles use a small markdown subset
// (h2/h3, paragraphs, lists, bold, code fences, inline code).

export interface PostMeta {
  slug: string;
  title: string;
  keyword: string;
  generated: string;
  description?: string;
}

export interface Post {
  meta: PostMeta;
  bodyHtml: string;
}

// Vite glob import: compiles all blog markdown into the bundle at build time.
const modules = import.meta.glob("./content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function parseFrontMatter(raw: string): { fm: Record<string, string>; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw };
  const fm: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w[\w-]*):\s*"?(.*?)"?\s*$/);
    if (kv) fm[kv[1]] = kv[2];
  }
  return { fm, body: m[2] };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  let inList: "ul" | "ol" | null = null;

  const closeList = () => {
    if (inList) {
      out.push(`</${inList}>`);
      inList = null;
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      closeList();
      out.push(inCode ? "</code></pre>" : "<pre><code>");
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      out.push(esc(line));
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) {
      if (inList !== "ul") {
        closeList();
        out.push("<ul>");
        inList = "ul";
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) {
      if (inList !== "ol") {
        closeList();
        out.push("<ol>");
        inList = "ol";
      }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    if (line.trim() === "") {
      closeList();
      continue;
    }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  if (inCode) out.push("</code></pre>");
  return out.join("\n");
}

function slugFromFile(path: string): string {
  return path.split("/").pop()!.replace(/\.md$/, "");
}

export function getAllPosts(): Post[] {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const { fm, body } = parseFrontMatter(raw);
      return {
        meta: {
          slug: slugFromFile(path),
          title: fm.title || fm.keyword || slugFromFile(path),
          keyword: fm.keyword || "",
          generated: fm.generated || "",
          description: fm.description,
        },
        bodyHtml: mdToHtml(body),
      };
    })
    .sort((a, b) => a.meta.title.localeCompare(b.meta.title));
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.meta.slug === slug);
}
