import { signOut, switchUser } from '@/app/actions/session';
import { demoAccounts } from '@/lib/auth/demo-accounts';
import type { Viewer } from '@/lib/data/viewer';

// Simulated login for the demo: choosing a person signs in as them on the
// server. Permissions come from that session in Postgres, not from this list.
export function UserSwitcher({ viewer }: { viewer: Viewer | null }) {
  const currentKey = viewer?.email.split('@')[0] ?? '';
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <form action={switchUser} className="flex items-center gap-2">
        <label htmlFor="account" className="text-neutral-600">
          Viewing as
        </label>
        <select
          id="account"
          name="account"
          defaultValue={currentKey}
          className="select select-sm select-bordered w-52"
        >
          <option value="" disabled>
            Choose a person
          </option>
          {demoAccounts.map((account) => (
            <option key={account.key} value={account.key}>
              {account.name} · {account.role}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-sm">
          Switch
        </button>
      </form>
      {viewer && (
        <form action={signOut}>
          <button type="submit" className="btn btn-sm btn-ghost">
            Sign out
          </button>
        </form>
      )}
    </div>
  );
}
