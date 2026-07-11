'use client';

import { useState, useEffect } from 'react';

import { formatCurrency } from '@/app/utils';
import api from '@/lib/axios';

interface Props {
  accountId: string;
  refreshTrigger: number;
}

const AccountBalanceCard = ({ accountId, refreshTrigger }: Props) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/ledger/balance/${accountId}`);
        setBalance(response.data.balance);
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [accountId, refreshTrigger]);

  if (isLoading) {
    return (
      <div className='mt-4 h-12 w-48 bg-white/10 animate-pulse rounded-lg' />
    );
  }

  return (
    <div className='mt-4 pt-2 flex items-baseline gap-2'>
      <span className='text-5xl font-extrabold tracking-tighter'>
        {balance !== null ? formatCurrency(balance) : formatCurrency(0)}
      </span>
    </div>
  );
};

export default AccountBalanceCard;
