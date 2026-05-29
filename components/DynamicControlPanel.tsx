"use client";
import { useState } from "react";

interface Props {
  options: string[];
  formFields: string[];
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function DynamicControlPanel({ options, formFields, onSend, disabled }: Props) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parts = Object.entries(formValues)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${k}: ${v}`);
    if (parts.length > 0) {
      onSend(parts.join(", "));
      setFormValues({});
    }
  }

  if (formFields.length > 0) {
    return (
      <form
        onSubmit={handleFormSubmit}
        className="mt-3 space-y-2"
        data-testid="structured-form"
      >
        {formFields.map((field) => (
          <div key={field}>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              {field}
            </label>
            <input
              type="text"
              value={formValues[field] || ""}
              onChange={(e) => setFormValues((p) => ({ ...p, [field]: e.target.value }))}
              placeholder={field}
              disabled={disabled}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
              data-testid={`form-field-${field.toLowerCase().replace(/\s+/g, "-")}`}
            />
          </div>
        ))}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={disabled}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            data-testid="form-submit-btn"
          >
            Submit
          </button>
        </div>
      </form>
    );
  }

  if (options.length === 0) return null;

  if (options.length >= 5) {
    return (
      <div className="mt-3" data-testid="selection-list">
        <select
          onChange={(e) => {
            if (e.target.value) {
              onSend(e.target.value);
              e.target.value = "";
            }
          }}
          disabled={disabled}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
          data-testid="options-select"
          defaultValue=""
        >
          <option value="" disabled>Select an option...</option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2" data-testid="option-chips">
      {options.map((opt, i) => (
        <button
          key={i}
          type="button"
          onClick={() => !disabled && onSend(opt)}
          disabled={disabled}
          className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50"
          data-testid={`option-chip-${i}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
