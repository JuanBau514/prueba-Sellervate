'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';

import { scoreLabels, severityStyles } from '@/components/review-labels';

import { saveReview, type ReviewFormState } from './actions';

type Criterion = { id: string; label: string; severity: 'critical' | 'major' | 'minor' };

const initialState: ReviewFormState = { error: null };

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && target.type === 'text');
}

export function ReviewForm({ replyId, criteria, skipHref }: { replyId: string; criteria: Criterion[]; skipHref: string | null }) {
  const [state, formAction, pending] = useActionState(saveReview, initialState);
  const [score, setScore] = useState<number | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isExample, setIsExample] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard-first review: 1–4 score, C jumps to the comment, ⌘/Ctrl+Enter saves.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        formRef.current?.requestSubmit();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (['1', '2', '3', '4'].includes(event.key)) {
        setScore(Number(event.key));
      } else if (event.key === 'c' || event.key === 'C') {
        event.preventDefault();
        commentRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleTag = (id: string) =>
    setTagIds((current) => (current.includes(id) ? current.filter((tag) => tag !== id) : [...current, id]));

  const groups = (['critical', 'major', 'minor'] as const)
    .map((severity) => ({ severity, items: criteria.filter((criterion) => criterion.severity === severity) }))
    .filter((group) => group.items.length > 0);

  return (
    <form ref={formRef} action={formAction} className="space-y-6" aria-describedby="review-shortcuts">
      <input type="hidden" name="replyId" value={replyId} />

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Score</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((value) => (
            <label
              key={value}
              className={`flex cursor-pointer items-baseline gap-2 rounded-field border px-3 py-2 transition-colors ${
                score === value ? 'border-primary bg-primary text-primary-content' : 'border-rule bg-sheet hover:border-primary'
              }`}
            >
              <input
                type="radio"
                name="score"
                value={value}
                checked={score === value}
                onChange={() => setScore(value)}
                className="sr-only"
                required
              />
              <span className="text-lg font-semibold tabular-nums">{value}</span>
              <span className="text-xs">{scoreLabels[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Issues found</legend>
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.severity} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
              <p className={`flex w-20 shrink-0 items-center gap-2 text-xs font-semibold ${severityStyles[group.severity].text}`}>
                <span className={`inline-block size-2 rounded-full ${severityStyles[group.severity].dot}`} aria-hidden />
                {severityStyles[group.severity].name}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((criterion) => {
                  const checked = tagIds.includes(criterion.id);
                  return (
                    <label
                      key={criterion.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-field border px-2.5 py-1 text-xs transition-colors ${
                        checked ? 'border-base-content bg-base-200' : 'border-rule bg-sheet hover:border-base-content'
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="tagIds"
                        value={criterion.id}
                        checked={checked}
                        onChange={() => toggleTag(criterion.id)}
                        className="checkbox checkbox-xs"
                      />
                      {criterion.label}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="comment" className="mb-2 block text-sm font-semibold">
          Comment for the specialist
        </label>
        <textarea
          id="comment"
          ref={commentRef}
          name="comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          maxLength={2000}
          required
          placeholder="What should they do differently next time, and why for this brand?"
          className="textarea w-full bg-sheet text-sm"
        />
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isExample"
            checked={isExample}
            onChange={(event) => setIsExample(event.target.checked)}
            className="checkbox checkbox-sm checkbox-primary"
          />
          Keep as a training example
        </label>
      </div>

      {state.error && (
        <p role="alert" className="rounded-field border border-critical/40 bg-critical/5 px-3 py-2 text-sm text-critical">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Saving…' : 'Save and next'}
        </button>
        {skipHref && (
          <Link href={skipHref} className="btn btn-ghost font-normal text-muted">
            Skip for now
          </Link>
        )}
        <p id="review-shortcuts" className="text-xs text-muted">
          <kbd className="kbd kbd-xs">1</kbd>–<kbd className="kbd kbd-xs">4</kbd> score ·{' '}
          <kbd className="kbd kbd-xs">C</kbd> comment · <kbd className="kbd kbd-xs">⌘/Ctrl</kbd>+
          <kbd className="kbd kbd-xs">Enter</kbd> save
        </p>
      </div>
    </form>
  );
}
