"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { StoreMember } from "@/lib/api-types";
import { addStoreManager, getStoreMembers, removeStoreManager } from "@/lib/client-api";

export default function StoreMembersPanel({ storeId }: { storeId: string }) {
  const [members, setMembers] = useState<StoreMember[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMembers(await getStoreMembers(storeId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Couldn't load the access list.");
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-[14px] border border-surfacestroke bg-background px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Who can sign in</p>
      <ul className="mt-3 space-y-2">
        {members.map((member) => (
          <li key={member.email} className="flex items-center justify-between gap-3 text-sm font-semibold text-foreground">
            <span className="min-w-0 truncate">
              {member.email} <span className="font-medium text-text-muted">({member.role})</span>
            </span>
            {member.role === "manager" ? (
              <button
                type="button"
                disabled={busy}
                aria-label={`Remove ${member.email}`}
                onClick={() => {
                  if (window.confirm(`Remove ${member.email}? They will lose access to this store.`)) {
                    void run(() => removeStoreManager(storeId, member.email));
                  }
                }}
                className="shrink-0 text-sm font-semibold text-error disabled:opacity-70"
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-error">
          {error}
        </p>
      ) : null}
      <form
        className="mt-3 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            await addStoreManager(storeId, email);
            setEmail("");
          });
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Manager email"
          aria-label="Manager email"
          className="h-11 w-full rounded-[12px] border border-surfacestroke bg-surface px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[12px] bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Add manager
        </button>
      </form>
    </div>
  );
}
