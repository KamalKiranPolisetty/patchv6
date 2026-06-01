"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  onSend: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  onClearError?: () => void;
};

export function ChatInput({ disabled, onSend, placeholder, error, onClearError }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // Autofocus on mount and when re-enabled
  useEffect(() => {
    if (!disabled && ref.current) ref.current.focus();
  }, [disabled]);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div
      data-testid="chat-input-container"
      className="w-full rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-3"
    >
      {error ? (
        <div
          data-testid="chat-input-error"
          role="alert"
          className="mb-2 rounded-md border border-red-200 bg-red-50 text-red-800 text-[12px] px-3 py-2"
        >
          <div className="flex items-start justify-between gap-3">
            <span>{error}</span>
            {onClearError ? (
              <button
                type="button"
                onClick={onClearError}
                className="text-red-800/70 hover:text-red-900 text-[12px] underline"
              >
                Dismiss
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          data-testid="chat-input-textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={disabled}
          rows={1}
          placeholder={placeholder ?? "Type your message…"}
          className="flex-1 resize-none bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-60 max-h-32"
        />
        <button
          type="button"
          data-testid="chat-input-send-btn"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="inline-flex items-center justify-center h-9 px-3 rounded-lg bg-patch-red text-white text-[13px] font-medium hover:bg-patch-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
