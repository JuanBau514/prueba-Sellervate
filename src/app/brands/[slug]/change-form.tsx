'use client';

import { useActionState } from 'react';

import { recordBrandChange, type ChangeFormState } from './actions';

const initialState: ChangeFormState = { error: null };

export function ChangeForm({ brandId, slug, today }: { brandId: string; slug: string; today: string }) {
  const [state, formAction, pending] = useActionState(recordBrandChange, initialState);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="brandId" value={brandId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <div>
          <label htmlFor="happenedOn" className="mb-1 block text-xs font-semibold text-muted">
            Date
          </label>
          <input id="happenedOn" name="happenedOn" type="date" defaultValue={today} max={today} required className="input input-sm w-full bg-sheet" />
        </div>
        <div>
          <label htmlFor="note" className="mb-1 block text-xs font-semibold text-muted">
            What changed
          </label>
          <input
            id="note"
            name="note"
            type="text"
            maxLength={500}
            required
            placeholder="e.g. New return policy briefed to the team"
            className="input input-sm w-full bg-sheet"
          />
        </div>
      </div>
      {state.error && (
        <p role="alert" className="rounded-field border border-critical/40 bg-critical/5 px-3 py-2 text-sm text-critical">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>
        {pending ? 'Saving…' : 'Record change'}
      </button>
    </form>
  );
}
