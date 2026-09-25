// P4: executable authorization check against the running stack.
// Run with `npm run authz-check` after `npm run seed`, with `npm run dev` running.
//
// Uses only the public anon key and real demo sessions; never the service role.
// Every check calls PostgREST or the app directly, bypassing the UI.

export {};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const password = process.env.DEMO_PASSWORD ?? '';
const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:3000';
// Must match ACCESS_COOKIE in src/lib/auth/tokens.ts.
const accessCookie = 'sv-access-token';

if (!supabaseUrl || !anonKey || !password) {
  console.error('authz-check: set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and DEMO_PASSWORD in .env.local');
  process.exit(1);
}

type Row = Record<string, unknown>;
let failures = 0;

function check(ok: boolean, label: string, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? '✓' : '✗'} ${label}${!ok && detail ? ` — ${detail}` : ''}`);
}

async function signIn(key: string): Promise<{ token: string; id: string }> {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${key}@demo.sellervate.test`, password }),
  });
  if (!response.ok) {
    console.error(`authz-check: cannot sign in as ${key} (${response.status}). Did you run npm run seed?`);
    process.exit(1);
  }
  const data = (await response.json()) as { access_token: string; user: { id: string } };
  return { token: data.access_token, id: data.user.id };
}

async function rest(token: string | null, path: string, init: RequestInit = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...init.headers,
    },
  });
  const text = await response.text();
  let rows: Row[] = [];
  try {
    const parsed = text ? JSON.parse(text) : [];
    rows = Array.isArray(parsed) ? parsed : [];
  } catch {
    // Non-JSON bodies are errors; status carries the result.
  }
  return { status: response.status, rows };
}

async function main() {
  const dani = await signIn('dani');
  const marta = await signIn('marta');
  const nuria = await signIn('nuria');

  // Discover fixture ids through legitimate sessions (no service role).
  const brandId = async (token: string, slug: string) =>
    String((await rest(token, `brands?select=id&slug=eq.${slug}`)).rows[0]?.id ?? '');
  const voltia = await brandId(marta.token, 'voltia');
  const cajaNorte = await brandId(marta.token, 'caja-norte');
  const brisa = await brandId(nuria.token, 'brisa-cafe');
  const lucia = String((await rest(marta.token, 'people?select=id&full_name=eq.Lucía Ferrer')).rows[0]?.id ?? '');

  const brisaReply = String((await rest(nuria.token, `replies?select=id&brand_id=eq.${brisa}&limit=1`)).rows[0]?.id ?? '');
  const luciaCajaReplies = await rest(marta.token, `replies?select=id,reviews(id)&brand_id=eq.${cajaNorte}&specialist_id=eq.${lucia}`);
  const luciaCajaReply = String(luciaCajaReplies.rows[0]?.id ?? '');
  const unreviewedCaja = String(luciaCajaReplies.rows.find((row) => !row.reviews)?.id ?? '');
  const ownReply = String((await rest(dani.token, 'replies?select=id&limit=1')).rows[0]?.id ?? '');

  if (!voltia || !cajaNorte || !brisa || !lucia || !brisaReply || !luciaCajaReply || !unreviewedCaja || !ownReply) {
    console.error('authz-check: seed data not found. Run npm run db:reset && npm run seed.');
    process.exit(1);
  }

  console.log('\nDatabase API (PostgREST, direct calls)');

  const anonReplies = await rest(null, 'replies?select=id');
  check(anonReplies.status >= 400 && anonReplies.rows.length === 0, 'Anonymous request cannot read replies', `status ${anonReplies.status}`);

  const ownRows = await rest(dani.token, 'replies?select=specialist_id');
  check(ownRows.rows.length > 0 && ownRows.rows.every((row) => row.specialist_id === dani.id),
    'Dani reads only his own replies', `${ownRows.rows.length} rows`);

  const foreignBrand = await rest(dani.token, `replies?select=id&brand_id=eq.${brisa}`);
  check(foreignBrand.rows.length === 0, "Dani gets 0 replies from another brand (Brisa Café)", `${foreignBrand.rows.length} rows`);

  const sameBrand = await rest(dani.token, `replies?select=id&id=eq.${luciaCajaReply}`);
  check(sameBrand.rows.length === 0, "Dani cannot read Lucía's reply in their shared brand (Caja Norte)", `${sameBrand.rows.length} rows`);

  const peerReviews = await rest(dani.token, 'reviews?select=id,reply:replies(specialist_id)');
  check(peerReviews.rows.length > 0 && peerReviews.rows.every((row) => (row.reply as Row | null)?.specialist_id === dani.id),
    "Dani reads his own reviews and none of another specialist's", `${peerReviews.rows.length} rows`);

  const daniChanges = await rest(dani.token, 'brand_changes?select=id');
  check(daniChanges.rows.length === 0, 'Specialists cannot read lead-only brand interventions');

  const daniReview = await rest(dani.token, 'reviews', {
    method: 'POST',
    body: JSON.stringify({ reply_id: ownReply, reviewer_id: dani.id, score: 4, comment: 'Self-review' }),
  });
  check(daniReview.status >= 400, 'A specialist cannot insert a review, even of his own reply', `status ${daniReview.status}`);

  const editReply = await rest(dani.token, `replies?id=eq.${ownReply}`, {
    method: 'PATCH',
    body: JSON.stringify({ body: 'Rewritten after the fact' }),
  });
  check(editReply.status >= 400 || editReply.rows.length === 0, 'Sent replies cannot be edited through the API', `status ${editReply.status}`);

  const nuriaVoltia = await rest(nuria.token, `replies?select=id&brand_id=eq.${voltia}`);
  check(nuriaVoltia.rows.length === 0, "Nuria (lead) gets 0 replies from Marta's brand", `${nuriaVoltia.rows.length} rows`);

  const daniQueue = await rest(dani.token, 'review_queue?select=reply_id');
  const daniCoverage = await rest(dani.token, 'review_coverage?select=specialist_id');
  check(daniQueue.rows.length === 0 && daniCoverage.rows.length === 0,
    "Specialists get no review queue or colleagues' coverage", `${daniQueue.rows.length}/${daniCoverage.rows.length} rows`);

  const nuriaQueue = await rest(nuria.token, 'review_queue?select=brand_id');
  check(nuriaQueue.rows.length > 0 && nuriaQueue.rows.every((row) => row.brand_id === brisa),
    "Nuria's queue contains only her brand", `${nuriaQueue.rows.length} rows`);

  const anonQueue = await rest(null, 'review_queue?select=reply_id');
  check(anonQueue.status >= 400 && anonQueue.rows.length === 0, 'Anonymous request cannot read the queue', `status ${anonQueue.status}`);

  const martaTeam = await rest(marta.token, `replies?select=id&brand_id=eq.${cajaNorte}&specialist_id=eq.${lucia}`);
  check(martaTeam.rows.length > 0, "Marta (lead) reads her brand's replies from every specialist");

  const foreignReview = await rest(marta.token, 'reviews', {
    method: 'POST',
    body: JSON.stringify({ reply_id: brisaReply, reviewer_id: marta.id, score: 1, comment: 'Not my brand' }),
  });
  check(foreignReview.status >= 400, "A lead cannot review another lead's brand", `status ${foreignReview.status}`);

  const impersonated = await rest(marta.token, 'reviews', {
    method: 'POST',
    body: JSON.stringify({ reply_id: unreviewedCaja, reviewer_id: nuria.id, score: 1, comment: 'Signed as Nuria' }),
  });
  check(impersonated.status >= 400, 'reviewer_id must be the session user; a lead cannot sign as someone else', `status ${impersonated.status}`);

  console.log(`\nApplication route (${appUrl})`);
  const appGet = async (id: string, token: string | null) => {
    try {
      const response = await fetch(`${appUrl}/api/replies/${id}`, {
        headers: token ? { Cookie: `${accessCookie}=${token}` } : {},
        redirect: 'manual',
      });
      return response.status;
    } catch {
      console.error(`authz-check: the app is not reachable at ${appUrl}. Start it with npm run dev.`);
      process.exit(1);
    }
  };

  check((await appGet(ownReply, dani.token)) === 200, 'GET /api/replies/<own> → 200');
  const foreignStatus = await appGet(brisaReply, dani.token);
  check(foreignStatus === 404, 'GET /api/replies/<another brand> → 404, not 403', `status ${foreignStatus}`);
  const peerStatus = await appGet(luciaCajaReply, dani.token);
  check(peerStatus === 404, "GET /api/replies/<same-brand colleague's> → 404", `status ${peerStatus}`);
  const anonStatus = await appGet(ownReply, null);
  check(anonStatus === 401, 'GET /api/replies/<id> without a session → 401', `status ${anonStatus}`);

  console.log(failures === 0 ? '\nauthz-check: all checks passed.' : `\nauthz-check: ${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error: unknown) => {
  console.error(`authz-check: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
