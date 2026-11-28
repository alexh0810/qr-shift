import { useEffect, useRef, useState } from "react";

import { validateReason } from "../corrections";

interface ReasonDialogProps {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function ReasonDialog({ onConfirm, onCancel }: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const error = validateReason(reason);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-title"
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (!error) {
            onConfirm(reason.trim());
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onCancel();
          }
        }}
        className="w-full max-w-md space-y-4 rounded-[24px] border border-surfacestroke bg-surface p-5"
      >
        <h2 id="reason-title" className="text-lg font-bold text-foreground">
          Why are you changing this shift?
        </h2>
        <div className="grid gap-2">
          <label htmlFor="correction-reason" className="text-sm font-semibold text-foreground">
            Reason
          </label>
          <input
            id="correction-reason"
            ref={inputRef}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={touched && !!error}
            aria-describedby={touched && error ? "correction-reason-error" : undefined}
            className="min-h-[44px] rounded-[16px] border border-surfacestroke bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {touched && error ? (
            <p id="correction-reason-error" role="alert" className="text-sm font-semibold text-error">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="min-h-[44px] rounded-[16px] border border-surfacestroke px-4 text-sm font-semibold">
            Cancel
          </button>
          <button type="submit" className="min-h-[44px] rounded-[16px] bg-primary px-4 text-sm font-semibold text-white">
            Save change
          </button>
        </div>
      </form>
    </div>
  );
}
