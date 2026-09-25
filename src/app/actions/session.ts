'use server';

import { redirect } from 'next/navigation';

import { demoEmail, findDemoAccount } from '@/lib/auth/demo-accounts';
import { clearSession, signInAs } from '@/lib/auth/session';

export async function switchUser(formData: FormData) {
  const account = findDemoAccount(formData.get('account'));
  if (!account) redirect('/?signin=unknown');

  const signedIn = await signInAs(demoEmail(account.key));
  redirect(signedIn ? '/' : '/?signin=failed');
}

export async function signOut() {
  await clearSession();
  redirect('/');
}
