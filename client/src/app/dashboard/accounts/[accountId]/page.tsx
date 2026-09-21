'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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

interface AccountInfo {
  id: string;
  name: string;
  type: 'ASSETS' | 'REVENUE' | 'EXPENSE' | 'LIABILITIES' | 'EQUITY';
  balance: number;
}

interface ReconciliationItem {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  isReconciled: boolean;
  journalEntryLine: {
    id: string;
    date: string;
    description: string;
  };
}

export default function AccountDetailsPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<AccountHistoryProp[]>([]);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [reconciliationItems, setReconciliationItems] = useState<
    ReconciliationItem[]
  >([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);

      try {
        const [accountResponse, transactionResponse, reconciliationResponse] =
          await Promise.all([
            api.get(`/accounts/${accountId}`),
            api.get(`/accounts/${accountId}/transactions`),
            api.get(`/accounts/${accountId}/reconciliation`),
          ]);

        setAccount(accountResponse.data);
        setTransactions(transactionResponse.data);
        setReconciliationItems(reconciliationResponse.data);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [accountId]);

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <p className='text-gray-400'>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className='max-w-5xl mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <Link
          href='/dashboard/accounts'
          className='inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-bold transition hover:bg-white/10'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Accounts
        </Link>

        <Link
          href={`/dashboard/import?accountId=${accountId}`}
          className='inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-black transition hover:bg-primary/90'
        >
          <ArrowRight className='h-4 w-4' />
          Import Statement
        </Link>
      </div>

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

      {/* Needs Reconciliation */}
      <div className='mt-10'>
        <div className='mb-5'>
          <h2 className='text-2xl font-bold'>Needs Reconciliation</h2>

          <p className='mt-1 text-gray-400'>
            Transactions that have not yet been reconciled.
          </p>
        </div>

        {!reconciliationItems.length ? (
          <div className='rounded-3xl border border-white/10 bg-white/5 p-8 text-center'>
            <h3 className='text-xl font-bold'>All caught up</h3>

            <p className='mt-2 text-gray-400'>
              There are no outstanding reconciliation items.
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {reconciliationItems.map((item) => {
              const date = new Date(item.journalEntryLine.date);

              const daysOutstanding = Math.floor(
                (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
              );

              return (
                <div
                  key={item.id}
                  className='rounded-2xl border border-white/10 bg-white/5 p-5'
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <h3 className='font-semibold'>
                        {item.journalEntryLine.description}
                      </h3>

                      <p className='mt-1 text-sm text-gray-400'>
                        {date.toLocaleDateString()}
                      </p>
                    </div>

                    <p className='text-xl font-bold'>
                      {formatCurrency(item.amount)}
                    </p>
                  </div>

                  <div className='mt-4 flex items-center justify-between text-sm'>
                    <span
                      className={
                        item.type === 'DEBIT'
                          ? 'font-semibold text-green-400'
                          : 'font-semibold text-red-400'
                      }
                    >
                      {item.type}
                    </span>

                    <span className='text-gray-500'>
                      {daysOutstanding} day
                      {daysOutstanding !== 1 ? 's' : ''} outstanding
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
