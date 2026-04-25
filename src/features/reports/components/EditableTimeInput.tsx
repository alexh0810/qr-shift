"use client";

import { useEffect, useState } from "react";

interface EditableTimeInputProps {
  value: string;
  className: string;
  onCommit: (value: string) => void;
}

function normalizeTimeDraft(rawValue: string) {
  const sanitized = rawValue.replace(/[^\d:]/g, "");

  if (sanitized.includes(":")) {
    const [rawHours = "", rawMinutes = ""] = sanitized.split(":", 2);
    const hours = rawHours.replace(/\D/g, "").slice(0, 2);
    const minutes = rawMinutes.replace(/\D/g, "").slice(0, 2);
    return sanitized.endsWith(":") || rawMinutes.length > 0 ? `${hours}:${minutes}` : hours;
  }

  const digits = sanitized.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

function parseCommittedTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function EditableTimeInput({
  value,
  className,
  onCommit,
}: EditableTimeInputProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commitDraft = () => {
    const normalized = parseCommittedTime(draft);
    if (!normalized) {
      setDraft(value);
      return;
    }

    setDraft(normalized);
    if (normalized !== value) {
      onCommit(normalized);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      maxLength={5}
      value={draft}
      onChange={(event) => setDraft(normalizeTimeDraft(event.target.value))}
      onBlur={commitDraft}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }

        if (event.key === "Escape") {
          setDraft(value);
          event.currentTarget.blur();
        }
      }}
      className={className}
    />
  );
}
