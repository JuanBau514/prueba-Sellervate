'use server';

import { redirect } from 'next/navigation';

import { logBrandChange } from '@/lib/data/brand-overview';
import { isUuid } from '@/lib/data/workspace';

export type ChangeFormState = { error: string | null };

const MAX_NOTE = 500;
const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

// The author is never read from the form: the database sets it to auth.uid()
// and RLS requires a lead assigned to this brand.
export async function recordBrandChange(_previous: ChangeFormState, formData: FormData): Promise<ChangeFormState> {
  const brandId = String(formData.get('brandId') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const happenedOn = String(formData.get('happenedOn') ?? '');
  const note = String(formData.get('note') ?? '').trim();

  if (!isUuid(brandId) || !/^[a-z0-9-]+$/.test(slug)) return { error: 'This brand could not be identified. Reload the page.' };
  const day = Date.parse(`${happenedOn}T00:00:00Z`);
  if (!dayPattern.test(happenedOn) || Number.isNaN(day)) return { error: 'Choose the date the change happened.' };
  if (day > Date.now()) return { error: 'Record changes once they have happened, not planned ones.' };
  if (!note) return { error: 'Describe what changed, so the trend can be read against it.' };
  if (note.length > MAX_NOTE) return { error: `Keep the note under ${MAX_NOTE} characters.` };

  const result = await logBrandChange({ brandId, happenedOn, note });
  if (!result.ok) {
    return {
      error:
        result.code === '42501'
          ? 'Only a lead assigned to this brand can record its changes.'
          : 'The change could not be saved. Nothing was stored; try again.',
    };
  }
  redirect(`/brands/${slug}?logged=1#changes`);
}
