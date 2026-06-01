// Minimal, safe Markdown renderer. Supports:
// - **bold** and *italic*
// - # / ## / ### headings
// - ordered + unordered lists
// - inline code `code`
// - paragraphs
// - inline images: ![alt](filename.png) — resolved to /api/kb-images/<filename>
//
// The renderer is intentionally narrow so we never need a full dependency and
// never render untrusted HTML.

import React from "react";

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "h"; level: 1 | 2 | 3; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "code"; text: string };

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const flushParagraph = (buf: string[]) => {
    if (buf.length === 0) return;
    blocks.push({ kind: "p", lines: buf });
    buf.length = 0;
  };

  const paraBuf: string[] = [];

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.replace(/\s+$/g, "");

    // Image-only line — break paragraph so the image sits on its own
    if (/^!\[.*?\]\([^)]+\)\s*$/.test(line)) {
      flushParagraph(paraBuf);
      blocks.push({ kind: "p", lines: [line] });
      i += 1;
      continue;
    }

    // Heading
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph(paraBuf);
      const level = heading[1].length as 1 | 2 | 3;
      blocks.push({ kind: "h", level, text: heading[2].trim() });
      i += 1;
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(line)) {
      flushParagraph(paraBuf);
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ""));
        i += 1;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      flushParagraph(paraBuf);
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    // Code block
    if (/^```/.test(line)) {
      flushParagraph(paraBuf);
      i += 1;
      const buf: string[] = [];
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1; // closing fence
      blocks.push({ kind: "code", text: buf.join("\n") });
      continue;
    }

    // Blank line — paragraph break
    if (line.trim() === "") {
      flushParagraph(paraBuf);
      i += 1;
      continue;
    }

    paraBuf.push(line);
    i += 1;
  }
  flushParagraph(paraBuf);
  return blocks;
}

type InlineToken =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "italic"; value: string }
  | { kind: "code"; value: string }
  | { kind: "img"; alt: string; src: string };

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;
  let buf = "";
  const flush = () => {
    if (buf) {
      tokens.push({ kind: "text", value: buf });
      buf = "";
    }
  };

  while (i < text.length) {
    // Image
    if (text[i] === "!" && text[i + 1] === "[") {
      const close = text.indexOf("]", i + 2);
      const paren = close >= 0 ? text.indexOf("(", close) : -1;
      const parenEnd = paren >= 0 ? text.indexOf(")", paren) : -1;
      if (close >= 0 && paren === close + 1 && parenEnd >= 0) {
        flush();
        const alt = text.slice(i + 2, close);
        const src = text.slice(paren + 1, parenEnd);
        tokens.push({ kind: "img", alt, src });
        i = parenEnd + 1;
        continue;
      }
    }

    // Bold **text**
    if (text[i] === "*" && text[i + 1] === "*") {
      const end = text.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        tokens.push({ kind: "bold", value: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    // Italic *text*
    if (text[i] === "*") {
      const end = text.indexOf("*", i + 1);
      if (end > i + 1 && !/\s/.test(text[i + 1])) {
        flush();
        tokens.push({ kind: "italic", value: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Inline code `text`
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i + 1) {
        flush();
        tokens.push({ kind: "code", value: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    buf += text[i];
    i += 1;
  }
  flush();
  return tokens;
}

function renderInline(tokens: InlineToken[]): React.ReactNode {
  return tokens.map((t, idx) => {
    if (t.kind === "text") return <React.Fragment key={idx}>{t.value}</React.Fragment>;
    if (t.kind === "bold") return <strong key={idx}>{t.value}</strong>;
    if (t.kind === "italic") return <em key={idx}>{t.value}</em>;
    if (t.kind === "code") return <code key={idx}>{t.value}</code>;
    if (t.kind === "img") {
      // Resolve the filename to our public route. If the src is already a URL
      // we keep it as-is so external content (rare) still works.
      const src = /^https?:\/\//.test(t.src) ? t.src : `/api/kb-images/${t.src}`;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={idx} src={src} alt="" data-testid="kb-inline-image" className="my-2 max-w-full rounded" />
      );
    }
    return null;
  });
}

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className="md-content text-[14px] leading-6 text-gray-800">
      {blocks.map((b, i) => {
        if (b.kind === "p") {
          return <p key={i}>{renderInline(parseInline(b.lines.join(" ")))}</p>;
        }
        if (b.kind === "h") {
          if (b.level === 1) return <h1 key={i}>{renderInline(parseInline(b.text))}</h1>;
          if (b.level === 2) return <h2 key={i}>{renderInline(parseInline(b.text))}</h2>;
          return <h3 key={i}>{renderInline(parseInline(b.text))}</h3>;
        }
        if (b.kind === "ul") {
          return (
            <ul key={i} className="list-disc pl-5">
              {b.items.map((item, j) => (
                <li key={j}>{renderInline(parseInline(item))}</li>
              ))}
            </ul>
          );
        }
        if (b.kind === "ol") {
          return (
            <ol key={i} className="list-decimal pl-5">
              {b.items.map((item, j) => (
                <li key={j}>{renderInline(parseInline(item))}</li>
              ))}
            </ol>
          );
        }
        if (b.kind === "code") {
          return (
            <pre key={i} className="my-2 overflow-x-auto rounded bg-gray-100 p-3 text-[12px]">
              <code>{b.text}</code>
            </pre>
          );
        }
        return null;
      })}
    </div>
  );
}
