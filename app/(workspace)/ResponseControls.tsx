"use client";

import { useState } from "react";
import type { LLMPayload } from "@/lib/llm";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/Label";

type Props = {
  payload: LLMPayload;
  onSubmit: (value: string) => void;
};

export function ResponseControls({ payload, onSubmit }: Props) {
  const options = payload.user_probable_options ?? [];
  const fields = payload.input_card_variables ?? [];
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const hasOptions = options.length > 0;
  const hasForm = fields.length > 0;
  const showAsList = options.length >= 5;

  if (!hasOptions && !hasForm) return null;

  // Form-only mode: typing must use the form.
  const isFormOnly = hasForm && !hasOptions;

  function handleOptionClick(value: string) {
    onSubmit(value);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filled = fields
      .map((f) => `${f}: ${formValues[f] ?? ""}`.trim())
      .filter((s) => s.endsWith(":") ? false : true)
      .join("; ");
    if (!filled) return;
    onSubmit(filled);
  }

  return (
    <div
      data-testid="response-controls"
      className="flex items-start gap-3 max-w-[85%] w-full"
    >
      <div className="w-7 flex-shrink-0" aria-hidden />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {hasOptions && !showAsList ? (
          <div className="flex flex-wrap gap-2" data-testid="response-controls-options">
            {options.map((opt, i) => (
              <button
                key={`${opt}-${i}`}
                type="button"
                data-testid={`response-option-${i}`}
                onClick={() => handleOptionClick(opt)}
                className="inline-flex items-center px-3 h-9 rounded-lg bg-white border border-gray-200 text-[13px] font-semibold text-gray-800 hover-elevate hover:bg-gray-50"
              >
                {opt}
              </button>
            ))}
          </div>
        ) : null}

        {hasOptions && showAsList ? (
          <div data-testid="response-controls-select-wrapper">
            <FieldLabel>Select an option</FieldLabel>
            <select
              data-testid="response-controls-select"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleOptionClick(e.target.value);
                  e.target.value = "";
                }
              }}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-patch-red/30 focus:border-patch-red"
            >
              <option value="" disabled>
                Choose an option…
              </option>
              {options.map((opt, i) => (
                <option key={`${opt}-${i}`} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {hasForm ? (
          <form
            data-testid="response-controls-form"
            onSubmit={handleFormSubmit}
            className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col gap-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          >
            {fields.map((field) => (
              <div key={field}>
                <FieldLabel htmlFor={`field-${field}`}>{field}</FieldLabel>
                <input
                  id={`field-${field}`}
                  data-testid={`response-form-input-${field.replace(/\s+/g, "-").toLowerCase()}`}
                  type="text"
                  value={formValues[field] ?? ""}
                  onChange={(e) =>
                    setFormValues((s) => ({ ...s, [field]: e.target.value }))
                  }
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-patch-red/30 focus:border-patch-red"
                  placeholder={`Enter ${field.toLowerCase()}…`}
                />
              </div>
            ))}
            <div className="flex justify-end">
              <Button
                type="submit"
                data-testid="response-form-submit-btn"
                size="sm"
                variant="primary"
                disabled={fields.some((f) => !(formValues[f] ?? "").trim())}
              >
                Submit
              </Button>
            </div>
          </form>
        ) : null}

        {!isFormOnly ? (
          <p className="text-[11px] text-gray-400 italic">
            Or type a custom reply below.
          </p>
        ) : null}
      </div>
    </div>
  );
}
