'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DynamicControls, { ControlDef } from './DynamicControls';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  control?: ControlDef;
  isTyping?: boolean;
  onOptionClick?: (option: string) => void;
  onFormSubmit?: (data: Record<string, Record<string, string>>) => void;
  index?: number;
  isLastAssistant?: boolean;
}

function KbImage({ alt, src }: { alt?: string; src?: string | undefined }) {
  if (!src) return null;
  // If src looks like a filename (no http, no /), use the kb image API
  const imageSrc =
    src.startsWith('http') || src.startsWith('/')
      ? src
      : `/api/kb/image?filename=${encodeURIComponent(src)}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={alt || ''}
      className="max-w-full rounded-lg border border-gray-200 my-2"
    />
  );
}

export default function ChatMessage({
  role,
  content,
  control,
  isTyping,
  onOptionClick,
  onFormSubmit,
  index,
  isLastAssistant,
}: ChatMessageProps) {
  if (isTyping) {
    return (
      <div className="flex items-start gap-3" data-testid="typing-indicator">
        <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">P</span>
        </div>
        <div className="bg-white border border-gray-200 border-l-4 border-l-red-600 rounded-xl px-4 py-3">
          <div className="flex gap-1 items-center h-5">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (role === 'user') {
    return (
      <div
        className="flex justify-end"
        data-testid={index !== undefined ? `message-${index}` : undefined}
      >
        <div className="max-w-[75%] bg-red-600 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div
      className="flex items-start gap-3"
      data-testid={index !== undefined ? `message-${index}` : undefined}
    >
      <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-white text-xs font-bold">P</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-200 border-l-4 border-l-red-600 rounded-xl px-4 py-3 text-sm leading-relaxed text-gray-800 prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ alt, src }) => <KbImage alt={alt} src={typeof src === 'string' ? src : undefined} />,
              a: ({ href, children }) => (
                <a href={href} className="text-red-600 underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-');
                return isBlock ? (
                  <code className="block bg-gray-100 rounded p-2 text-xs font-mono overflow-x-auto">{children}</code>
                ) : (
                  <code className="bg-gray-100 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {control && isLastAssistant && (
          <DynamicControls
            control={control}
            onOptionClick={onOptionClick || (() => {})}
            onFormSubmit={onFormSubmit || (() => {})}
          />
        )}
      </div>
    </div>
  );
}
