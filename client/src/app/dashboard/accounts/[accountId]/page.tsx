'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/app/utils';
import api from '@/lib/axios';

interface AccountHistoryProp {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  journalEntryLine: {
    id: string;
    date: string;
    description: string;
  };
}

export default function AccountDetailsPage({
  params,
}: {
  params: { accountId: string };
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<AccountHistoryProp[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(
          `/ledger/accounts/${params.accountId}/transactions`,
        );
        setTransactions(response.data);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [params.accountId]);

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <p className='text-gray-400'>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className='max-w-5xl mx-auto'>
      <Link
        href='/dashboard/accounts'
        className='inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-bold transition hover:bg-white/10 mb-8'
      >
        <ArrowLeft className='h-4 w-4' />
        Back to Accounts
      </Link>

      <div className='mb-8'>
        <h1 className='text-4xl font-bold tracking-tight'>
          Transaction History
        </h1>
        <p className='mt-2 text-gray-400'>
          View every transaction recorded for this account.
        </p>
      </div>

      {!transactions.length ? (
        <div className='rounded-3xl border border-white/10 bg-white/5 p-12 text-center'>
          <h2 className='text-2xl font-bold'>No transactions yet</h2>
          <p className='mt-3 text-gray-400'>
            This account has no transaction history.
          </p>
          <p className='mt-6 text-sm text-gray-500'>
            Create a transaction from the dashboard to see activity here.
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className='rounded-2xl border border-white/10 bg-white/5 p-5'
            >
              <h3 className='font-semibold'>
                {transaction.journalEntryLine.description}
              </h3>
              <p
                className={`text-sm font-semibold ${
                  transaction.type === 'DEBIT'
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {transaction.type}
              </p>
              <p className='text-2xl font-bold'>
                {formatCurrency(transaction.amount)}
              </p>
              <p className='text-xs text-gray-500'>
                {new Date(
                  transaction.journalEntryLine.date,
                ).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
