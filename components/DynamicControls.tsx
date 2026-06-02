'use client';

import { useState } from 'react';

export interface ControlDef {
  type: string;
  options?: string[];
  inputCardVariables?: Array<{ label: string; key: string; required: boolean }>;
  needsCountFirst?: boolean;
  countPrompt?: string;
  totalCards?: number;
}

interface DynamicControlsProps {
  control: ControlDef;
  onOptionClick: (option: string) => void;
  onFormSubmit: (data: Record<string, Record<string, string>>) => void;
  disabled?: boolean;
}

function InputCardForm({
  variables,
  cardIndex,
  totalCards,
  cardData,
  onChange,
}: {
  variables: Array<{ label: string; key: string; required: boolean }>;
  cardIndex: number;
  totalCards: number;
  cardData: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
      {totalCards > 1 && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Device {cardIndex + 1} of {totalCards}
        </p>
      )}
      {variables.map((v) => (
        <div key={v.key}>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {v.label} {v.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={v.required}
            value={cardData[v.key] || ''}
            onChange={(e) => onChange(v.key, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      ))}
    </div>
  );
}

export default function DynamicControls({
  control,
  onOptionClick,
  onFormSubmit,
  disabled,
}: DynamicControlsProps) {
  const [selected, setSelected] = useState('');
  const [cardDataMap, setCardDataMap] = useState<Record<string, Record<string, string>>>({});
  const [countValue, setCountValue] = useState('');

  const handleCardChange = (cardIndex: number, key: string, value: string) => {
    setCardDataMap((prev) => ({
      ...prev,
      [cardIndex]: { ...(prev[cardIndex] || {}), [key]: value },
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFormSubmit(cardDataMap);
  };

  const handleCountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (countValue) {
      onOptionClick(`Count: ${countValue}`);
    }
  };

  if (disabled) return null;

  if (control.type === 'probable_options' && control.options && control.options.length > 0) {
    return (
      <div className="flex flex-wrap gap-2 mt-3" data-testid="probable-options">
        {control.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onOptionClick(opt)}
            className="px-4 py-2 rounded-full border-2 border-red-600 text-red-600 text-sm font-medium hover:bg-red-600 hover:text-white transition-colors"
            data-testid={`option-${i}`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (control.type === 'single_select' && control.options && control.options.length > 0) {
    return (
      <div className="mt-3 flex gap-2" data-testid="single-select">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Select an option...</option>
          {control.options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <button
          onClick={() => { if (selected) onOptionClick(selected); }}
          disabled={!selected}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:bg-gray-300 transition-colors"
        >
          Confirm
        </button>
      </div>
    );
  }

  if (control.type === 'input_cards' && control.inputCardVariables) {
    const totalCards = control.totalCards || 1;
    return (
      <form onSubmit={handleFormSubmit} className="mt-3 space-y-3" data-testid="input-cards">
        {Array.from({ length: totalCards }).map((_, i) => (
          <InputCardForm
            key={i}
            variables={control.inputCardVariables!}
            cardIndex={i}
            totalCards={totalCards}
            cardData={cardDataMap[i] || {}}
            onChange={(key, value) => handleCardChange(i, key, value)}
          />
        ))}
        <button
          type="submit"
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Submit
        </button>
      </form>
    );
  }

  if (control.type === 'needs_count') {
    return (
      <form onSubmit={handleCountSubmit} className="mt-3 flex gap-2" data-testid="count-form">
        <input
          type="number"
          min="1"
          max="20"
          value={countValue}
          onChange={(e) => setCountValue(e.target.value)}
          placeholder={control.countPrompt || 'Enter count'}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
          type="submit"
          disabled={!countValue}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:bg-gray-300 transition-colors"
        >
          Continue
        </button>
      </form>
    );
  }

  return null;
}
