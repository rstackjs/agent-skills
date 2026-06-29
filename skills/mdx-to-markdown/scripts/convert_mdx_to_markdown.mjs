#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";

const SITE_DOMAINS = {
  rspack: "rspack.rs",
  rsbuild: "rsbuild.rs",
  rspress: "rspress.rs",
  rslib: "rslib.rs",
  rsdoctor: "rsdoctor.rs",
  rstest: "rstest.rs",
};

const COMMENT_PREFIX = {
  bash: "#",
  sh: "#",
  shell: "#",
  css: "/*",
  scss: "/*",
  less: "/*",
  html: "<!--",
  xml: "<!--",
};

const CODE_HIGHLIGHT_MARKER = /\s*\/\/\s*\[!code highlight\]\s*$/;

function commentLine(language, title) {
  const prefix = COMMENT_PREFIX[language];
  if (prefix === "/*") return `/* ${title} */`;
  if (prefix === "<!--") return `<!-- ${title} -->`;
  if (prefix === "#") return `# ${title}`;
  return `// ${title}`;
}

function stripFrontmatter(text) {
  if (!text.startsWith("---\n")) return text;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return text;
  const after = text.indexOf("\n", end + 4);
  return after === -1 ? "" : text.slice(after + 1);
}

function replacePackageTabs(text) {
  return text.replace(
    /<PackageManagerTabs\s+command="([^"]+)"\s*\/>/g,
    (_, command) => `\`\`\`bash\npnpm ${command.trim()}\n\`\`\``,
  );
}

function replaceCenteredImages(text) {
  return text.replace(
    /<div\s+align="center">\s*\n\s*<img\s+(?=[^>]*\bsrc="([^"]+)")(?=[^>]*\balt="([^"]*)")[^>]*\/>\s*\n\s*<\/div>/g,
    (_, src, alt) => `![${alt}](${src})`,
  );
}

function normalizeLines(text, linkPrefix) {
  const lines = text.split(/\r?\n/);
  const output = [];
  let pendingTitle = null;
  let fence = null;

  const emitFence = () => {
    const hasHighlight = fence.lines.some(line => CODE_HIGHLIGHT_MARKER.test(line));
    const language = hasHighlight ? "diff" : fence.language;
    output.push(`\`\`\`${language}`);
    if (fence.title) output.push(commentLine(language, fence.title));

    for (let line of fence.lines) {
      if (CODE_HIGHLIGHT_MARKER.test(line)) {
        line = line.replace(CODE_HIGHLIGHT_MARKER, "");
        output.push(`+${line}`);
      } else {
        output.push(line);
      }
    }

    output.push("```");
    fence = null;
  };

  for (const rawLine of lines) {
    let line = rawLine;

    if (fence) {
      if (line === "```") {
        emitFence();
      } else {
        fence.lines.push(line);
      }
      continue;
    }

    if (/^\s*import\s+.+?;\s*$/.test(line)) continue;
    if (line.trim() === "<BlogAuthors />") continue;
    if (/^<a id="[^"]+"><\/a>$/.test(line.trim())) continue;

    const heading = line.match(/^(#{1,6}\s+.+?)\s+\\\{#[A-Za-z0-9_-]+\}$/);
    if (heading) line = heading[1];

    const caption = line.match(/^\*\*([^*]+)\*\*$/);
    if (caption) {
      pendingTitle = caption[1];
      continue;
    }

    const fenceWithTitle = line.match(/^```([A-Za-z0-9_-]+)\s+title="([^"]+)"$/);
    if (fenceWithTitle) {
      const [, language, title] = fenceWithTitle;
      fence = { language, title, lines: [] };
      pendingTitle = null;
      continue;
    }

    const plainFence = line.match(/^```([A-Za-z0-9_-]*)$/);
    if (plainFence) {
      fence = { language: plainFence[1], title: pendingTitle, lines: [] };
      pendingTitle = null;
      continue;
    }

    const toc = line.match(/^(\s*-\s+)\[([^\]]+)\]\(#[^)]+\)(.*)$/);
    if (toc) line = `${toc[1]}${toc[2]}${toc[3]}`;
    if (linkPrefix) {
      const prefix = linkPrefix.replace(/\/$/, "");
      line = line.replace(/(^|[^!])(\[[^\n]*?\]\()\/(?!\/)/g, `$1$2${prefix}/`);
    }

    output.push(line);
  }

  if (fence) emitFence();

  return `${output.join("\n").trim()}\n`;
}

function convert(text, linkPrefix) {
  return normalizeLines(
    replaceCenteredImages(replacePackageTabs(stripFrontmatter(text))),
    linkPrefix,
  );
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function gitOutput(cwd, args) {
  try {
    return execFileSync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function findGitRoot(inputPath) {
  return gitOutput(dirname(inputPath), ["rev-parse", "--show-toplevel"]);
}

function repositoryCandidates(inputPath, gitRoot) {
  const candidates = [];
  const add = value => {
    if (value) candidates.push(value.toLowerCase());
  };

  add(basename(gitRoot || dirname(inputPath)));

  const remoteUrl = gitRoot
    ? gitOutput(gitRoot, ["config", "--get", "remote.origin.url"])
    : "";
  const remoteName = remoteUrl.match(/([^/:]+?)(?:\.git)?$/)?.[1];
  add(remoteName);

  for (let current = dirname(inputPath); ; current = dirname(current)) {
    const pkg = readJson(join(current, "package.json"));
    if (pkg) {
      add(pkg.name);
      add(pkg.name?.split("/").pop());
    }
    if (current === gitRoot || current === dirname(current)) break;
  }

  for (const part of inputPath.split(/[\\/]+/)) {
    add(part);
  }

  return candidates;
}

function detectProduct(inputPath, gitRoot) {
  for (const candidate of repositoryCandidates(inputPath, gitRoot)) {
    const normalized = candidate.replace(/^@rstackjs\//, "");
    if (SITE_DOMAINS[normalized]) return normalized;
    for (const product of Object.keys(SITE_DOMAINS)) {
      if (normalized.startsWith(`${product}-`)) return product;
    }
  }
  return null;
}

function detectLocalePrefix(inputPath) {
  const parts = inputPath.split(/[\\/]+/);
  if (parts.includes("zh")) return "/zh";
  return "";
}

function inferLinkPrefix(inputPath) {
  const gitRoot = findGitRoot(inputPath);
  const product = detectProduct(inputPath, gitRoot);
  if (!product) return null;
  return `https://${SITE_DOMAINS[product]}${detectLocalePrefix(inputPath)}`;
}

function usage() {
  console.error(
    "Usage: convert_mdx_to_markdown.mjs <input.mdx> [output.md] [--link-prefix <prefix>]",
  );
}

function parseArgs(argv) {
  const args = [...argv];
  let linkPrefix;
  const positional = [];

  while (args.length) {
    const arg = args.shift();
    if (arg === "--link-prefix") {
      linkPrefix = args.shift();
      if (!linkPrefix) throw new Error("--link-prefix requires a value");
      continue;
    }
    positional.push(arg);
  }

  if (positional.length < 1 || positional.length > 2) {
    throw new Error("expected one input path and optional output path");
  }

  return {
    input: positional[0],
    output:
      positional[1] ??
      join(dirname(positional[0]), `${basename(positional[0], extname(positional[0]))}.md`),
    linkPrefix,
  };
}

try {
  const { input, output, linkPrefix } = parseArgs(process.argv.slice(2));
  const text = readFileSync(input, "utf8");
  writeFileSync(output, convert(text, linkPrefix ?? inferLinkPrefix(input)), "utf8");
  console.log(`Wrote ${output}`);
} catch (error) {
  usage();
  console.error(error.message);
  process.exitCode = 1;
}
