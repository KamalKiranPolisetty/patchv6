'use client'

interface DecisionPanelProps {
  question: string
  onSelect: (answer: string) => void
}

export function DecisionPanel({ question, onSelect }: DecisionPanelProps) {
  return (
    <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl" data-testid="decision-panel">
      <p className="text-sm text-gray-700 font-medium mb-3" data-testid="decision-question">{question}</p>
      <div className="flex gap-3">
        <button
          onClick={() => onSelect('Yes, resolved')}
          className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
          data-testid="decision-yes-btn"
        >
          ✓ Yes, resolved
        </button>
        <button
          onClick={() => onSelect('No, still having issues')}
          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
          data-testid="decision-no-btn"
        >
          ✗ No, still having issues
        </button>
      </div>
    </div>
  )
}

interface OptionChipsProps {
  options: string[]
  onSelect: (option: string) => void
}

export function OptionChips({ options, onSelect }: OptionChipsProps) {
  return (
    <div className="mt-3 flex flex-wrap gap-2" data-testid="option-chips">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-400 transition-colors text-gray-700"
          data-testid={`option-chip-${opt.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
