import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

const site = {
  title: "公司官网介绍页",
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function parseFrontmatter(source) {
  if (!source.startsWith("---\n")) {
    return [{}, source];
  }

  const end = source.indexOf("\n---", 4);
  if (end === -1) {
    return [{}, source];
  }

  const raw = source.slice(4, end).trim();
  const content = source.slice(end + 4).trim();
  const data = {};

  for (const line of raw.split("\n")) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    data[key] = value;
  }

  return [data, content];
}

function renderInline(value) {
  return escapeHtml(value).replaceAll(/`([^`]+)`/g, "<code>$1</code>");
}

function renderMarkdown(source) {
  const lines = source.split("\n");
  const html = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+?)(?:\s+\{#([A-Za-z0-9_-]+)\})?$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = heading[2];
      const id = heading[3] ? ` id="${escapeHtml(heading[3])}"` : "";
      html.push(`<h${level}${id}>${renderInline(text)}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return html.join("\n");
}

function relativeUrl(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

function renderLayout(layout, page, content) {
  return layout
    .replaceAll("{{ page.title }}", escapeHtml(page.title ?? ""))
    .replaceAll("{{ page.description }}", escapeHtml(page.description ?? ""))
    .replaceAll("{{ page.hero_title }}", escapeHtml(page.hero_title ?? ""))
    .replaceAll("{{ page.hero_subtitle }}", escapeHtml(page.hero_subtitle ?? ""))
    .replaceAll("{{ page.hero_image | relative_url }}", relativeUrl(page.hero_image ?? ""))
    .replaceAll("{{ page.cta_link }}", escapeHtml(page.cta_link ?? "#"))
    .replaceAll("{{ page.cta_text }}", escapeHtml(page.cta_text ?? "了解更多"))
    .replaceAll("{{ site.title }}", escapeHtml(site.title))
    .replaceAll("{{ content }}", content)
    .replaceAll(/\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}/g, (_, path) => relativeUrl(path));
}

export async function buildPreview() {
  const [markdown, layout, css] = await Promise.all([
    readFile("index.md", "utf8"),
    readFile("_layouts/company.html", "utf8"),
    readFile("assets/css/style.css", "utf8"),
  ]);

  const [page, markdownContent] = parseFrontmatter(markdown);
  const content = renderMarkdown(markdownContent);
  const html = renderLayout(layout, page, content);

  await mkdir("_site/assets/css", { recursive: true });
  await writeFile("_site/index.html", html);
  await writeFile("_site/assets/css/style.css", css);
  await cp("assets/images", "_site/assets/images", { recursive: true });

  return "_site/index.html";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = await buildPreview();
  console.log(`Built ${output}`);
}
