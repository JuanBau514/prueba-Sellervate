'use client';

import { LoadFailure } from '@/components/load-failure';

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <LoadFailure digest={error.digest} retry={retry} />;
}
