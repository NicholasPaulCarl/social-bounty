'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BusinessOrganisationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/business/brands');
  }, [router]);

  return null;
}
