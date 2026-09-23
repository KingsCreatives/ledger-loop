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

type JournalEntryLine = {
  id: string;
  date: string;
  description: string;
  source?: 'MANUAL' | 'IMPORT';
};

interface ReconciliationItem {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  isReconciled: boolean;
  journalEntryLine: JournalEntryLine;
}

interface ReconciliationCandidate {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  isReconciled: boolean;
  reconciledAt: string | null;
  journalEntryId: string;
  accountId: string;
  journalEntryLine: JournalEntryLine;
}

interface ReconciliationMatches {
  line: ReconciliationCandidate;
  candidates: ReconciliationCandidate[];
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

  const [selectedReconciliationItem, setSelectedReconciliationItem] =
    useState<ReconciliationItem | null>(null);

  const [matches, setMatches] = useState<ReconciliationMatches | null>(null);

  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matching, setMatching] = useState(false);

  const [matchesError, setMatchesError] = useState('');
  const [reconcileError, setReconcileError] = useState('');

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

  const fetchMatches = async (lineId: string) => {
    const item =
      reconciliationItems.find((item: { id: string }) => item.id === lineId) ??
      null;

    setSelectedReconciliationItem(item);
    setMatches(null);
    setMatchesError('');
    setReconcileError('');
    setLoadingMatches(true);

    try {
      const response = await api.get(
        `/accounts/${accountId}/reconciliation/${lineId}/matches`,
      );

      setMatches(response.data);
    } catch (error: any) {
      console.error('Failed to fetch reconciliation matches:', error);
      setMatchesError(
        error.response?.data?.message ??
          'Failed to load matches for this transaction. Please try again.',
      );
    } finally {
      setLoadingMatches(false);
    }
  };

  const reconcileMatch = async (candidateId: string) => {
    if (!selectedReconciliationItem) return;

    setReconcileError('');
    setMatching(true);

    try {
      await api.post(
        `/accounts/${accountId}/reconciliation/${selectedReconciliationItem.id}/match`,
        {
          candidateId,
        },
      );

      const reconciliationResponse = await api.get(
        `/accounts/${accountId}/reconciliation`,
      );

      setReconciliationItems(reconciliationResponse.data);

      setSelectedReconciliationItem(null);
      setMatches(null);
    } catch (error: any) {
      console.error('Failed to reconcile transaction:', error);
      setReconcileError(
        error.response?.data?.message ??
          'Failed to reconcile this match. Please try again.',
      );
    } finally {
      setMatching(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <p className='text-gray-400'>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-5xl'>
      <div className='mb-8 flex items-center justify-between'>
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

              const isSelected = selectedReconciliationItem?.id === item.id;

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

                  <button
                    type='button'
                    onClick={() => fetchMatches(item.id)}
                    disabled={loadingMatches}
                    className='mt-4 w-full rounded-xl bg-primary px-4 py-2 text-sm font-bold text-black transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    {loadingMatches && isSelected
                      ? 'Finding matches...'
                      : 'Find Matches'}
                  </button>

                  {isSelected && matchesError && (
                    <p className='mt-3 text-sm text-destructive'>
                      {matchesError}
                    </p>
                  )}

                  {isSelected && loadingMatches && (
                    <div className='mt-4 text-center text-sm text-gray-400'>
                      Searching for matching transactions...
                    </div>
                  )}

                  {isSelected && !loadingMatches && matches && (
                    <div className='mt-5 border-t border-white/10 pt-5'>
                      <h4 className='font-semibold'>Matching Transactions</h4>

                      {reconcileError && (
                        <p className='mt-3 text-sm text-destructive'>
                          {reconcileError}
                        </p>
                      )}

                      {!matches.candidates.length ? (
                        <div className='mt-3 rounded-xl border border-white/10 bg-white/5 p-4'>
                          <p className='text-sm text-gray-400'>
                            No matching transaction was found.
                          </p>
                        </div>
                      ) : (
                        <div className='mt-3 space-y-3'>
                          {matches.candidates.map((candidate) => (
                            <div
                              key={candidate.id}
                              className='rounded-xl border border-white/10 bg-black/10 p-4'
                            >
                              <div className='flex items-start justify-between gap-4'>
                                <div>
                                  <p className='font-medium'>
                                    {candidate.journalEntryLine.description}
                                  </p>

                                  <p className='mt-1 text-sm text-gray-400'>
                                    {new Date(
                                      candidate.journalEntryLine.date,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>

                                <p className='font-bold'>
                                  {formatCurrency(candidate.amount)}
                                </p>
                              </div>

                              <div className='mt-3 flex items-center justify-between'>
                                <span
                                  className={
                                    candidate.type === 'DEBIT'
                                      ? 'text-sm font-semibold text-green-400'
                                      : 'text-sm font-semibold text-red-400'
                                  }
                                >
                                  {candidate.type}
                                </span>

                                <button
                                  type='button'
                                  onClick={() => reconcileMatch(candidate.id)}
                                  disabled={matching}
                                  className='rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
                                >
                                  {matching ? 'Matching...' : 'Match'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
