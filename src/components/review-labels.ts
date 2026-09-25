// Shared by server and client components; plain data only.

export const scoreLabels: Record<number, string> = {
  1: 'Serious problem',
  2: 'Needs work',
  3: 'Solid',
  4: 'Exemplary',
};

// The only place severity colours are assigned.
export const severityStyles = {
  critical: { name: 'Critical', dot: 'bg-critical', text: 'text-critical' },
  major: { name: 'Major', dot: 'bg-major', text: 'text-major' },
  minor: { name: 'Minor', dot: 'bg-minor', text: 'text-minor' },
} as const;
