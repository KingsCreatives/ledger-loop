'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import api from '@/lib/axios';
import { formatCurrency } from '@/app/utils';
import { Button } from '@/components/ui/button';
import { AccountSelector } from '@/components/AccountSelector';

interface AccountInfo {
  id: string;
  name: string;
  type: 'ASSETS' | 'REVENUE' | 'EXPENSE' | 'LIABILITIES' | 'EQUITY';
  balance: number;
}

interface ValidRow {
  rowNumber: number;
  date: string;
  description: string;
  amount: number;
}

interface ImportError {
  row?: number;
  message: string;
}

interface MatchCandidate {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  journalEntryLine: {
    date: string;
    description: string;
  };
}

type RowDecision =
  | { status: 'LINKED'; candidateId: string }
  | { status: 'NONE' }
  | { status: 'UNDECIDED' };

interface MatchResult {
  rowNumber: number;
  status: 'NO_MATCH' | 'SUGGESTED_MATCH' | 'AMBIGUOUS';
  candidates: MatchCandidate[];
}

interface ParseResponse {
  batchId: string;
  status: string;
  validCount: number;
  errorCount: number;
  matchResults: MatchResult[];
  validRows: ValidRow[];
  errors: ImportError[];
}

function ImportPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get('accountId');

  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [hasOffsetOptions, setHasOffsetOptions] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const [validRows, setValidRows] = useState<ValidRow[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [decisions, setDecisions] = useState<Record<number, RowDecision>>({});

  const [parseError, setParseError] = useState('');

  const [offsetAccountId, setOffsetAccountId] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const getMatchResult = (rowNumber: number): MatchResult | undefined => {
    return matchResults.find((m) => m.rowNumber === rowNumber);
  };

  const resetParseState = () => {
    setValidRows([]);
    setErrors([]);
    setBatchId(null);
    setMatchResults([]);
    setDecisions({});
    setOffsetAccountId(null);
    setCommitError(null);
    setParseError('');
  };

  const setRowDecision = (rowNumber: number, decision: RowDecision) => {
    setDecisions((prev) => ({ ...prev, [rowNumber]: decision }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (selectedFile && !selectedFile.name.toLowerCase().endsWith('.csv')) {
      setFile(null);
      return;
    }

    setFile(selectedFile);
    resetParseState();
  };

  useEffect(() => {
    if (!accountId) {
      router.replace('/dashboard/accounts');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [accountResponse, allAccountsResponse] = await Promise.all([
          api.get(`/accounts/${accountId}`),
          api.get('/accounts'),
        ]);

        setAccount(accountResponse.data);

        const otherAccounts = allAccountsResponse.data.filter(
          (acc: AccountInfo) => acc.id !== accountId,
        );
        setHasOffsetOptions(otherAccounts.length > 0);
      } catch (error) {
        console.error('Failed to fetch account:', error);
        router.replace('/dashboard/accounts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accountId, router]);

  const handleParse = async () => {
    if (!file || !accountId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', accountId);

    setIsParsing(true);
    resetParseState();

    try {
      const response = await api.post<ParseResponse>('/import/parse', formData);

      setValidRows(response.data.validRows);
      setErrors(response.data.errors);
      setBatchId(response.data.batchId);
      setMatchResults(response.data.matchResults);

      const initialDecisions: Record<number, RowDecision> = {};
      for (const row of response.data.matchResults) {
        if (row.status === 'SUGGESTED_MATCH' || row.status === 'AMBIGUOUS') {
          initialDecisions[row.rowNumber] = { status: 'UNDECIDED' };
        }
      }
      setDecisions(initialDecisions);
    } catch (error: any) {
      console.error('Failed to parse import:', error);
      setParseError(
        error.response?.data?.message ??
          'Failed to parse this file. Please try again.',
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommit = async () => {
    if (!batchId || !offsetAccountId) return;

    if (offsetAccountId === accountId) {
      setCommitError(
        'The offset account must be different from the account you are importing into.',
      );
      return;
    }

    setCommitError(null);
    setIsCommitting(true);

    try {
      await api.post('/import/commit', {
        batchId,
        offsetAccountId,
      });

      router.push(`/dashboard/accounts/${accountId}`);
    } catch (error) {
      console.error('Failed to commit import:', error);
      setCommitError(
        'Something went wrong committing this import. Please try again.',
      );
    } finally {
      setIsCommitting(false);
    }
  };

  if (isLoading || !account) {
    return (
      <div className='flex justify-center py-12'>
        <p className='text-gray-400'>Loading account...</p>
      </div>
    );
  }

  const hasResults = validRows.length > 0 || errors.length > 0;
  const allRowsFailed = errors.length > 0 && validRows.length === 0;

  const noMatchRows = validRows.filter(
    (row) => getMatchResult(row.rowNumber)?.status === 'NO_MATCH',
  );
  const suggestedRows = validRows.filter(
    (row) => getMatchResult(row.rowNumber)?.status === 'SUGGESTED_MATCH',
  );
  const ambiguousRows = validRows.filter(
    (row) => getMatchResult(row.rowNumber)?.status === 'AMBIGUOUS',
  );

  return (
    <div className='max-w-5xl mx-auto space-y-6'>
      <header>
        <h1 className='text-4xl font-extrabold tracking-tight'>
          Import Statement
        </h1>
        <p className='mt-2 text-gray-400'>
          Importing into{' '}
          <span className='text-primary font-semibold'>{account.name}</span>
        </p>
      </header>

      <div className='rounded-3xl border border-white/10 bg-white/5 p-8'>
        <div className='mb-6'>
          <h2 className='text-lg font-bold'>Upload Statement</h2>
          <p className='mt-1 text-sm text-gray-400'>
            Upload a CSV bank statement to preview your transactions before
            anything is committed.
          </p>
        </div>

        <label
          htmlFor='statement-file'
          className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-12 transition-all ${
            isParsing
              ? 'pointer-events-none opacity-50'
              : 'cursor-pointer hover:border-primary/50 hover:bg-white/10'
          }`}
        >
          <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
            {file ? (
              <FileText className='h-6 w-6' />
            ) : (
              <Upload className='h-6 w-6' />
            )}
          </div>

          {file ? (
            <>
              <p className='font-semibold text-white'>{file.name}</p>
              <p className='mt-1 text-sm text-gray-400'>
                {(file.size / 1024).toFixed(1)} KB — click to choose a different
                file
              </p>
            </>
          ) : (
            <>
              <p className='font-semibold text-white'>Choose a CSV file</p>
              <p className='mt-1 text-sm text-gray-400'>
                Click here to browse your files
              </p>
            </>
          )}

          <input
            id='statement-file'
            type='file'
            accept='.csv,text/csv'
            onChange={handleFileChange}
            disabled={isParsing}
            className='hidden'
          />
        </label>

        <div className='mt-6 flex justify-end'>
          <Button
            onClick={handleParse}
            disabled={!file || isParsing}
            className='h-12 rounded-xl px-6 font-bold text-black'
          >
            {isParsing ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Parsing...
              </>
            ) : (
              'Upload & Preview'
            )}
          </Button>
        </div>

        {parseError && (
          <p className='mt-3 text-sm text-destructive'>{parseError}</p>
        )}
      </div>

      {hasResults && (
        <div className='flex flex-wrap gap-3'>
          <div className='flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary'>
            <CheckCircle2 className='h-4 w-4' />
            {validRows.length} valid
          </div>
          {errors.length > 0 && (
            <div className='flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive'>
              <AlertCircle className='h-4 w-4' />
              {errors.length} skipped
            </div>
          )}
        </div>
      )}

      

      {/* {validRows.length > 0 && (
        <div className='overflow-hidden rounded-3xl border border-white/10 bg-white/5'>
          <div className='border-b border-white/10 px-6 py-4'>
            <h2 className='font-bold'>Valid Transactions</h2>
            <p className='text-sm text-gray-400'>
              These rows are ready to be committed once you choose an offset
              account below.
            </p>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead className='bg-white/5'>
                <tr>
                  <th className='px-6 py-3 font-medium text-gray-400 uppercase tracking-widest text-xs'>
                    Date
                  </th>
                  <th className='px-6 py-3 font-medium text-gray-400 uppercase tracking-widest text-xs'>
                    Description
                  </th>
                  <th className='px-6 py-3 text-right font-medium text-gray-400 uppercase tracking-widest text-xs'>
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {validRows.map((row, index) => (
                  <tr
                    key={index}
                    className='border-t border-white/10 transition-colors hover:bg-white/5'
                  >
                    <td className='px-6 py-4 text-gray-300'>
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 text-white'>{row.description}</td>
                    <td
                      className={`px-6 py-4 text-right font-semibold ${
                        row.amount < 0 ? 'text-destructive' : 'text-primary'
                      }`}
                    >
                      {formatCurrency(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} */}

      {noMatchRows.length > 0 && (
        <div className='rounded-3xl border border-white/10 bg-white/5 p-6'>
          <h2 className='mb-1 font-bold'>No Match Found</h2>
          <p className='mb-4 text-sm text-gray-400'>
            These don't match anything already in your books — they'll be
            created as new entries.
          </p>
          <div className='space-y-2'>
            {noMatchRows.map((row) => (
              <div
                key={row.rowNumber}
                className='flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm'
              >
                <div>
                  <p className='font-medium text-white'>{row.description}</p>
                  <p className='text-gray-400'>
                    {new Date(row.date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`font-semibold ${
                    row.amount < 0 ? 'text-destructive' : 'text-primary'
                  }`}
                >
                  {formatCurrency(row.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestedRows.length > 0 && (
        <div className='rounded-3xl border border-white/10 bg-white/5 p-6'>
          <h2 className='mb-1 font-bold'>Suggested Matches</h2>
          <p className='mb-4 text-sm text-gray-400'>
            These look like entries you've already recorded. Confirm to mark
            them reconciled instead of creating duplicates.
          </p>
          <div className='space-y-4'>
            {suggestedRows.map((row) => {
              const match = getMatchResult(row.rowNumber);
              const candidate = match?.candidates[0];
              const decision = decisions[row.rowNumber];
              if (!candidate) return null;

              return (
                <div
                  key={row.rowNumber}
                  className='rounded-2xl border border-white/10 bg-white/5 p-4'
                >
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <div>
                      <p className='text-xs uppercase tracking-widest text-gray-500'>
                        From Statement
                      </p>
                      <p className='mt-1 font-medium text-white'>
                        {row.description}
                      </p>
                      <p className='text-sm text-gray-400'>
                        {new Date(row.date).toLocaleDateString()} —{' '}
                        {formatCurrency(row.amount)}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs uppercase tracking-widest text-gray-500'>
                        Already in Your Books
                      </p>
                      <p className='mt-1 font-medium text-white'>
                        {candidate.journalEntryLine.description}
                      </p>
                      <p className='text-sm text-gray-400'>
                        {new Date(
                          candidate.journalEntryLine.date,
                        ).toLocaleDateString()}{' '}
                        — {formatCurrency(candidate.amount)}
                      </p>
                    </div>
                  </div>

                  <div className='mt-4 flex items-center gap-3'>
                    <Button
                      type='button'
                      variant={
                        decision?.status === 'LINKED' ? 'default' : 'outline'
                      }
                      onClick={() =>
                        setRowDecision(row.rowNumber, {
                          status: 'LINKED',
                          candidateId: candidate.id,
                        })
                      }
                      className='h-9 rounded-lg px-4 text-xs font-bold'
                    >
                      Yes, same transaction
                    </Button>
                    <Button
                      type='button'
                      variant={
                        decision?.status === 'NONE' ? 'default' : 'outline'
                      }
                      onClick={() =>
                        setRowDecision(row.rowNumber, { status: 'NONE' })
                      }
                      className='h-9 rounded-lg px-4 text-xs font-bold'
                    >
                      No, create as new
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ambiguousRows.length > 0 && (
        <div className='rounded-3xl border border-white/10 bg-white/5 p-6'>
          <h2 className='mb-1 font-bold'>Needs Your Input</h2>
          <p className='mb-4 text-sm text-gray-400'>
            Multiple existing entries could match these. Pick the right one, or
            choose "none of these" to create a new entry.
          </p>
          <div className='space-y-4'>
            {ambiguousRows.map((row) => {
              const match = getMatchResult(row.rowNumber);
              const decision = decisions[row.rowNumber];
              if (!match) return null;

              return (
                <div
                  key={row.rowNumber}
                  className='rounded-2xl border border-white/10 bg-white/5 p-4'
                >
                  <p className='text-xs uppercase tracking-widest text-gray-500'>
                    From Statement
                  </p>
                  <p className='mt-1 font-medium text-white'>
                    {row.description}
                  </p>
                  <p className='mb-4 text-sm text-gray-400'>
                    {new Date(row.date).toLocaleDateString()} —{' '}
                    {formatCurrency(row.amount)}
                  </p>

                  <p className='mb-2 text-xs uppercase tracking-widest text-gray-500'>
                    Which one is this?
                  </p>
                  <div className='space-y-2'>
                    {match.candidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        type='button'
                        onClick={() =>
                          setRowDecision(row.rowNumber, {
                            status: 'LINKED',
                            candidateId: candidate.id,
                          })
                        }
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                          decision?.status === 'LINKED' &&
                          decision.candidateId === candidate.id
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className='text-white'>
                          {candidate.journalEntryLine.description}
                        </span>
                        <span className='text-gray-400'>
                          {new Date(
                            candidate.journalEntryLine.date,
                          ).toLocaleDateString()}{' '}
                          — {formatCurrency(candidate.amount)}
                        </span>
                      </button>
                    ))}

                    <button
                      type='button'
                      onClick={() =>
                        setRowDecision(row.rowNumber, { status: 'NONE' })
                      }
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                        decision?.status === 'NONE'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      None of these — create as new
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className='rounded-3xl border border-white/10 bg-white/5 p-6'>
          <h2 className='mb-4 font-bold'>Rows Skipped</h2>

          <div className='space-y-2'>
            {errors.map((error, index) => (
              <div
                key={index}
                className='flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm'
              >
                <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-destructive' />
                <p className='text-gray-200'>
                  {error.row !== undefined && (
                    <span className='font-semibold text-destructive'>
                      Row {error.row}:{' '}
                    </span>
                  )}
                  {error.message}
                </p>
              </div>
            ))}
          </div>

          {allRowsFailed && (
            <p className='mt-4 text-sm text-gray-400'>
              None of the rows in this file could be imported. Fix the issues
              above in your source file and upload it again.
            </p>
          )}
        </div>
      )}

      {batchId && validRows.length > 0 && (
        <div className='rounded-3xl border border-white/10 bg-white/5 p-8'>
          <div className='mb-5'>
            <h2 className='text-lg font-bold'>Choose an Offset Account</h2>
            <p className='mt-1 text-sm text-gray-400'>
              Every imported transaction needs a counterparty account for the
              other side of the entry — e.g. Revenue for money in, Expenses for
              money out.
            </p>
          </div>

          {hasOffsetOptions ? (
            <>
              <AccountSelector
                label='Offset Account'
                placeholder='Select offset account'
                disabled={isCommitting}
                onSelect={(id) => {
                  setOffsetAccountId(id);
                  setCommitError(null);
                }}
              />

              {commitError && (
                <p className='mt-3 text-sm text-destructive'>{commitError}</p>
              )}

              <Button
                onClick={handleCommit}
                disabled={!offsetAccountId || isCommitting}
                className='mt-5 h-12 w-full rounded-xl font-bold text-black'
              >
                {isCommitting ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Importing...
                  </>
                ) : (
                  'Confirm Import'
                )}
              </Button>
            </>
          ) : (
            <p className='rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400'>
              You need at least one other account to serve as the offset (e.g. a
              Revenue or Expense account) before you can commit this import.
            </p>
          )}
        </div>
      )}
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
