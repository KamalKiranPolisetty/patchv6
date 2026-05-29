export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-4" data-testid="typing-indicator">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "#DC2626" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3L14.5 8.5H20L15.5 12L17.5 18L12 14.5L6.5 18L8.5 12L4 8.5H9.5L12 3Z" fill="white" />
        </svg>
      </div>
      <div
        className="px-4 py-3 rounded-xl"
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderLeft: "2px solid #DC2626",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: "#DC2626",
                animation: `typing-bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes typing-bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-6px); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
