'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AccountBalanceCard from '@/components/AccountBalanceCard';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import api from '@/lib/axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Account {
  id: string;
  name: string;
  type: 'ASSETS' | 'LIABILITIES' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
}

const selectContentClass = 'bg-[#1a1f26] border-white/10 text-white';

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedEquityId, setSelectedEquityId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const handleTransactionSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/ledger/accounts');
      setAccounts(response.data);

      const firstAsset = response.data.find(
        (account: Account) => account.type === 'ASSETS',
      );
      const firstEquity = response.data.find(
        (account: Account) => account.type === 'EQUITY',
      );

      setSelectedAssetId(firstAsset?.id ?? '');
      setSelectedEquityId(firstEquity?.id ?? '');
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const assetAccounts = accounts.filter((account) => account.type === 'ASSETS');
  const equityAccounts = accounts.filter(
    (account) => account.type === 'EQUITY',
  );

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <p className='text-gray-400'>Loading dashboard...</p>
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className='max-w-2xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-12 text-center'>
        <h1 className='text-2xl font-bold'>Welcome to LedgerLoop</h1>
        <p className='mt-3 text-gray-400'>
          You haven&apos;t created any accounts yet.
        </p>
        <Link
          href='/dashboard/accounts'
          className='mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-black transition hover:bg-primary/90'
        >
          Create your first account
        </Link>
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6'>
      <div className='col-span-1 md:col-span-2 p-8 rounded-3xl bg-linear-to-br from-white/10 to-white/5 border border-white/10 shadow-2xl transition-all hover:border-white/20'>
        <div className='space-y-2 mb-8'>
          <p className='text-sm font-medium text-gray-400 uppercase tracking-widest opacity-70'>
            Asset Account
          </p>

          {assetAccounts.length > 0 ? (
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger className='w-full max-w-sm bg-white/5 border-white/10'>
                <SelectValue placeholder='Select an asset account' />
              </SelectTrigger>
              <SelectContent position='popper' sideOffset={6} align='start'>
                {assetAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className='text-sm text-gray-500'>
              No asset accounts yet.{' '}
              <Link
                href='/dashboard/accounts'
                className='underline hover:text-white'
              >
                Create one
              </Link>
              .
            </p>
          )}
        </div>

        {selectedAssetId && (
          <AccountBalanceCard
            accountId={selectedAssetId}
            refreshTrigger={refreshKey}
          />
        )}

        <div className='mt-8 flex gap-3'>
          <AddTransactionModal onSuccess={handleTransactionSuccess} />
          <button className='px-6 py-2.5 bg-white/10 border border-white/10 rounded-full font-bold text-sm hover:bg-white/20 transition-all active:scale-95'>
            Details
          </button>
        </div>
      </div>

      <div className='p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all'>
        <div className='space-y-2 mb-8'>
          <p className='text-sm font-medium text-gray-400 uppercase tracking-widest opacity-70'>
            Equity Account
          </p>

          {equityAccounts.length > 0 ? (
            <Select
              value={selectedEquityId}
              onValueChange={setSelectedEquityId}
            >
              <SelectTrigger className='w-full max-w-sm bg-white/5 border-white/10'>
                <SelectValue placeholder='Select an equity account' />
              </SelectTrigger>
              <SelectContent position='popper' sideOffset={6} align='start'>
                {equityAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className='text-sm text-gray-500'>
              No equity accounts yet.{' '}
              <Link
                href='/dashboard/accounts'
                className='underline hover:text-white'
              >
                Create one
              </Link>
              .
            </p>
          )}
        </div>

        {selectedEquityId && (
          <AccountBalanceCard
            accountId={selectedEquityId}
            refreshTrigger={refreshKey}
          />
        )}
      </div>
    </div>
  );
}
