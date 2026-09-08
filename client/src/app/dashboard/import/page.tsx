'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface AccountInfo {
  id: string;
  name: string;
  type: 'ASSETS' | 'REVENUE' | 'EXPENSE' | 'LIABILITIES' | 'EQUITY';
  balance: number;
}

function ImportPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get('accountId');

  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<AccountInfo | null>(null);

  useEffect(() => {
    if (!accountId) {
      router.replace('/dashboard/accounts');
      return;
    }

    const fetchAccount = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/accounts/${accountId}`);
        setAccount(response.data);
      } catch (error) {
        console.error('Failed to fetch account:', error);
        router.replace('/dashboard/accounts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccount();
  }, [accountId, router]);

  if (isLoading || !account) {
    return (
      <div className='flex justify-center py-12'>
        <p className='text-gray-400'>Loading account...</p>
      </div>
    );
  }

  return (
    <div className='max-w-5xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold tracking-tight'>Import Statement</h1>
        <p className='mt-2 text-gray-400'>
          Importing into:{' '}
          <span className='text-white font-semibold'>{account.name}</span>
        </p>
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense
      fallback={
        <div className='flex justify-center py-12'>
          <p className='text-gray-400'>Loading...</p>
        </div>
      }
    >
      <ImportPageContent />
    </Suspense>
  );
}
