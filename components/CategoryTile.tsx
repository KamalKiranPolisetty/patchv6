"use client";

interface CategoryTileProps {
  name: string;
  kbAvailable: boolean;
  onClick: () => void;
}

export default function CategoryTile({ name, kbAvailable, onClick }: CategoryTileProps) {
  return (
    <button
      data-testid={`category-tile-${name.toLowerCase()}`}
      onClick={onClick}
      className="group flex flex-col items-center gap-3 bg-white border border-gray-200 rounded-2xl px-8 py-6 shadow-sm hover:border-red-300 hover:shadow-md transition-all cursor-pointer text-center"
    >
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
        </svg>
      </div>
      <div>
        <p data-testid={`category-tile-name-${name.toLowerCase()}`} className="font-semibold text-gray-900 text-base">{name}</p>
        <span
          data-testid={`category-kb-status-${name.toLowerCase()}`}
          className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded ${
            kbAvailable
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {kbAvailable ? "KB Available" : "KB Missing"}
        </span>
      </div>
    </button>
  );
}
