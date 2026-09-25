import { signOut, switchUser } from '@/app/actions/session';
import { demoAccounts } from '@/lib/auth/demo-accounts';
import type { Viewer } from '@/lib/data/viewer';

// Simulated login for the demo: choosing a person signs in as them on the
// server. Permissions come from that session in Postgres, not from this list.
export function UserSwitcher({ viewer }: { viewer: Viewer | null }) {
  const currentKey = viewer?.email.split('@')[0] ?? '';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={switchUser} className="flex items-center gap-2">
        <label htmlFor="account" className="text-xs text-muted">
          Viewing as
        </label>
        <select
          id="account"
          name="account"
          defaultValue={currentKey}
          className="select select-sm w-56 bg-sheet text-sm"
        >
          <option value="" disabled>
            Choose a person
          </option>
          <optgroup label="Team leads">
            {demoAccounts.filter((account) => account.role === 'Lead').map((account) => (
              <option key={account.key} value={account.key}>
                {account.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Specialists">
            {demoAccounts.filter((account) => account.role === 'Specialist').map((account) => (
              <option key={account.key} value={account.key}>
                {account.name}
              </option>
            ))}
          </optgroup>
        </select>
        <button type="submit" className="btn btn-sm btn-primary">
          Switch
        </button>
      </form>
      {viewer && (
        <form action={signOut}>
          <button type="submit" className="btn btn-sm btn-ghost font-normal text-muted">
            Sign out
          </button>
        </form>
      )}
    </div>
  );
}
