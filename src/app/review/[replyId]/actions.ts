'use server';

import { redirect } from 'next/navigation';

import { isUuid, nextInQueue, submitReview } from '@/lib/data/workspace';

export type ReviewFormState = { error: string | null };

const MAX_COMMENT = 2000;

// Validation mirrors the database constraints so the lead gets a clear message
// before a round trip; the database still enforces every rule.
// The reviewer is never read from the form: submit_review uses auth.uid().
export async function saveReview(_previous: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const replyId = String(formData.get('replyId') ?? '');
  const score = Number(formData.get('score'));
  const comment = String(formData.get('comment') ?? '').trim();
  const isExample = formData.get('isExample') === 'on';
  const tagIds = formData.getAll('tagIds').map(String);

  if (!isUuid(replyId)) return { error: 'This reply could not be identified. Go back to the queue and open it again.' };
  if (!Number.isInteger(score) || score < 1 || score > 4) return { error: 'Choose a score from 1 to 4.' };
  if (!comment) return { error: 'Write a comment for the specialist: the score alone does not tell them what to change.' };
  if (comment.length > MAX_COMMENT) return { error: `Keep the comment under ${MAX_COMMENT} characters.` };
  if (!tagIds.every(isUuid)) return { error: 'One of the selected issues is not valid. Reload the page and try again.' };

  const result = await submitReview({ replyId, score, comment, isExample, tagIds });
  if (!result.ok) {
    switch (result.code) {
      case '23505':
        return { error: 'Someone already reviewed this reply. Reload to see their review.' };
      case '42501':
        return { error: 'You can only review replies in brands you lead.' };
      case '23514':
      case '23503':
        return { error: 'One of the selected issues does not apply to this brand, or you are no longer assigned to it. Nothing was saved.' };
      default:
        return { error: 'The review could not be saved. Nothing was stored; try again.' };
    }
  }

  const next = await nextInQueue(replyId);
  redirect(next ? `/review/${next}?saved=1` : '/review?saved=1');
}
