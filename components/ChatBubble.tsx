"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date | string;
}

export default function ChatBubble({ role, content, timestamp }: Props) {
  const ts = timestamp ? new Date(timestamp) : null;
  const timeStr = ts
    ? ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  if (role === "user") {
    return (
      <div className="flex justify-end mb-4" data-testid="chat-bubble-user">
        <div className="max-w-lg">
          <div
            className="px-4 py-3 rounded-xl text-white text-sm leading-relaxed"
            style={{ background: "#DC2626" }}
          >
            {content}
          </div>
          {timeStr && (
            <p className="text-right text-xs mt-1" style={{ color: "#9CA3AF" }}>
              {timeStr}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 mb-4" data-testid="chat-bubble-assistant">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-5"
        style={{ background: "#DC2626" }}
        data-testid="patch-avatar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3L14.5 8.5H20L15.5 12L17.5 18L12 14.5L6.5 18L8.5 12L4 8.5H9.5L12 3Z" fill="white" />
        </svg>
      </div>
      <div className="max-w-lg flex-1">
        <p className="text-xs mb-1 font-medium" style={{ color: "#9CA3AF" }} data-testid="patch-name-label">
          Patch
        </p>
        <div
          className="px-4 py-3 rounded-xl text-sm leading-relaxed"
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderLeft: "2px solid #DC2626",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            color: "#111111",
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ src, alt }) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={alt || ""}
                  className="max-w-full rounded-lg my-2"
                  style={{ display: "block" }}
                  data-testid="chat-inline-image"
                />
              ),
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-0.5">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {timeStr && (
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }} data-testid="chat-timestamp">
            {timeStr}
          </p>
        )}
      </div>
    </div>
  );
}
