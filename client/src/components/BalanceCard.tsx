'use client';

import { useState, useEffect } from 'react';

import { formatCurrency } from '@/app/utils';

interface Props {
  refreshTrigger: number;
}

const BalanceCard = ({refreshTrigger}: Props) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ledger/balance/9063bc8e-e752-4e19-a164-c012c684ebfd`,
        );
        const data = await response.json();

        setBalance(data.balance);
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className='mt-4 h-12 w-48 bg-white/10 animate-pulse rounded-lg' />
    );
  }

  return (
    <div className='mt-4 flex items-baseline gap-2'>
      <span className='text-5xl font-extrabold tracking-tighter'>
        {balance !== null ? formatCurrency(balance) : '$0.00'}
      </span>
      <span className='text-green-400 text-sm font-bold'>+2.5%</span>
    </div>
  );
};

export default BalanceCard;
