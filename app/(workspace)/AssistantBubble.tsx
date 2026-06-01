"use client";

import { PatchMark } from "@/components/ui/Logo";
import { Markdown } from "@/lib/markdown";
import { formatDateTime } from "@/lib/utils";
import type { LLMPayload } from "@/lib/llm";

type Props = {
  payload: LLMPayload;
  timestamp?: string;
};

export function AssistantBubble({ payload, timestamp }: Props) {
  return (
    <div className="flex flex-col items-start" data-testid="assistant-turn">
      <div className="flex items-start gap-3 max-w-[85%] w-full">
        <PatchMark size={28} className="flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <div
            data-testid="assistant-meta"
            className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1"
          >
            Patch
          </div>
          <div
            data-testid="assistant-card"
            className="bg-white border border-gray-200 border-l-[2px] border-l-patch-red rounded-2xl rounded-tl-md px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          >
            <Markdown source={payload.response || ""} />
          </div>
          {timestamp ? (
            <div data-testid="assistant-timestamp" className="text-[11px] text-gray-400 mt-1.5 ml-1">
              {formatDateTime(timestamp)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
