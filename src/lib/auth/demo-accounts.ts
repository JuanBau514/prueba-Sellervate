import 'server-only';

// Accounts created by scripts/seed.ts. This list only feeds the user switcher;
// it grants nothing. What each account can see is decided by RLS.
export const demoAccounts = [
  { key: 'marta', name: 'Marta Ibáñez', role: 'Lead' },
  { key: 'nuria', name: 'Nuria Castells', role: 'Lead' },
  { key: 'dani', name: 'Dani Ruiz', role: 'Specialist' },
  { key: 'lucia', name: 'Lucía Ferrer', role: 'Specialist' },
  { key: 'oscar', name: 'Óscar Medina', role: 'Specialist' },
] as const;

export type DemoAccountKey = (typeof demoAccounts)[number]['key'];

export const demoEmail = (key: DemoAccountKey) => `${key}@demo.sellervate.test`;

export function findDemoAccount(key: unknown) {
  return demoAccounts.find((account) => account.key === key) ?? null;
}
