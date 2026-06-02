"use client";

interface Props {
  content: string;
}

export default function SimpleMarkdown({ content }: Props) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H1
    if (line.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="text-base font-semibold text-gray-900 mt-3 mb-1">
          {inlineMarkdown(line.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-gray-900 mt-2 mb-1">
          {inlineMarkdown(line.slice(3))}
        </h3>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-sm font-medium text-gray-800 mt-2 mb-0.5">
          {inlineMarkdown(line.slice(4))}
        </h4>
      );
      i++;
      continue;
    }

    // Unordered list item
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-0.5 my-1 pl-1">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-gray-800">
              {inlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list item
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-0.5 my-1 pl-1">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-gray-800">
              {inlineMarkdown(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line — spacer
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Normal paragraph line
    elements.push(
      <p key={i} className="text-sm text-gray-800 leading-relaxed">
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}

function inlineMarkdown(text: string): React.ReactNode {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
