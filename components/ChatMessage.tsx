"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date | string;
  type?: "text" | "summary_card" | "feedback_card";
  metadata?: Record<string, unknown>;
}

interface ChatMessageProps {
  message: Message;
}

function formatTime(ts?: Date | string) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div
        data-testid="chat-message-user"
        className="flex justify-end mb-4"
      >
        <div className="max-w-[70%]">
          <div className="bg-red-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
            {message.content}
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="chat-message-assistant" className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center mt-1">
        <span className="text-white text-xs font-bold">P</span>
      </div>
      <div className="flex-1 max-w-[80%]">
        <p className="text-xs text-gray-400 mb-1 font-medium">Patch</p>
        <div
          className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed shadow-sm"
          style={{ borderLeft: "2px solid #DC2626" }}
        >
          <div className="prose prose-sm max-w-none text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">{formatTime(message.timestamp)}</p>
      </div>
    </div>
  );
}
