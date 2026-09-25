import 'server-only';

import { select } from './rest';

export type Brand = { id: string; slug: string; name: string };

/** Brands the viewer is assigned to (RLS: membership required). */
export function listBrands() {
  return select<Brand>('brands?select=id,slug,name&order=name');
}
