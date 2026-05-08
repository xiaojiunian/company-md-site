import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

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
  const source = String(value);
  const pattern = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  let output = "";
  let match;

  while ((match = pattern.exec(source))) {
    output += escapeHtml(source.slice(cursor, match.index));

    if (match[1]) {
      output += `<code>${escapeHtml(match[1])}</code>`;
    } else {
      output += `<a href="${escapeHtml(match[3])}">${escapeHtml(match[2])}</a>`;
    }

    cursor = pattern.lastIndex;
  }

  output += escapeHtml(source.slice(cursor));
  return output;
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

async function findMarkdownFiles(directory = ".") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const file = join(directory, entry.name);

    if (entry.isDirectory()) {
      if ([".git", "_site", "assets", "node_modules"].includes(entry.name)) continue;
      files.push(...(await findMarkdownFiles(file)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md") {
      files.push(file.replace(/^\.\//, ""));
    }
  }

  return files.sort();
}

export async function buildPreview() {
  const [markdownFiles, layout, css] = await Promise.all([
    findMarkdownFiles(),
    readFile("_layouts/company.html", "utf8"),
    readFile("assets/css/style.css", "utf8"),
  ]);

  await mkdir("_site/assets/css", { recursive: true });
  await writeFile("_site/assets/css/style.css", css);
  await cp("assets/images", "_site/assets/images", { recursive: true });

  const builtFiles = [];

  for (const file of markdownFiles) {
    const markdown = await readFile(file, "utf8");
    const [page, markdownContent] = parseFrontmatter(markdown);

    if (!page.layout) continue;

    const content = renderMarkdown(markdownContent);
    const html = renderLayout(layout, page, content);
    const output = file === "index.md" ? "index.html" : file.replace(/\.md$/, ".html");

    await mkdir(dirname(`_site/${output}`), { recursive: true });
    await writeFile(`_site/${output}`, html);
    builtFiles.push(`_site/${output}`);
  }

  return builtFiles;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outputs = await buildPreview();
  console.log(`Built ${outputs.join(", ")}`);
}
