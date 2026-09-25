import { getAccessToken } from '@/lib/auth/session';
import { getReply } from '@/lib/data/replies';
import { SignedOutError } from '@/lib/data/rest';

// 404 for both "does not exist" and "not yours": a 403 would confirm that
// another brand's or specialist's reply exists.
export async function GET(_request: Request, ctx: RouteContext<'/api/replies/[id]'>) {
  if (!(await getAccessToken())) {
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    const reply = await getReply(id);
    if (!reply) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(reply);
  } catch (error) {
    if (error instanceof SignedOutError) {
      return Response.json({ error: 'Sign in required' }, { status: 401 });
    }
    throw error;
  }
}
