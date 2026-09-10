'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface AccountInfo {
  id: string;
  name: string;
  type: 'ASSETS' | 'REVENUE' | 'EXPENSE' | 'LIABILITIES' | 'EQUITY';
  balance: number;
}

interface ValidRow {
  date: string;
  description: string;
  amount: number;
}

interface ImportError {
  rowNumber?: number;
  message: string;
}

interface ParseResponse {
  batchId: string;
  status: string;
  validCount: number;
  errorCount: number;
  validRows: ValidRow[];
  errors: ImportError[];
}

function ImportPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get('accountId');

  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<AccountInfo | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const [validRows, setValidRows] = useState<ValidRow[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);

 const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
   const selectedFile = event.target.files?.[0] ?? null;

   if (selectedFile && !selectedFile.name.toLowerCase().endsWith('.csv')) {
     setFile(null);
     return;
   }

   setFile(selectedFile);
   setValidRows([]);
   setErrors([]);
   setBatchId(null);
 };

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

  const handleParse = async () => {
    if (!file || !accountId) return;

    const formData = new FormData();

    formData.append('file', file);
    formData.append('accountId', accountId);

    setIsParsing(true);

    try {
      const response = await api.post<ParseResponse>('/import/parse', formData);

      setValidRows(response.data.validRows);
      setErrors(response.data.errors);
      setBatchId(response.data.batchId);
    } catch (error) {
      console.error('Failed to parse import:', error);
    } finally {
      setIsParsing(false);
    }
  };

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
        {/* <input type='file' accept='.csv,text/csv' onChange={handleFileChange} /> */}
        <div className='mt-6 rounded-xl border border-gray-800 bg-gray-900/60 p-6'>
          <div className='mb-4'>
            <h2 className='text-lg font-semibold'>Upload Statement</h2>
            <p className='mt-1 text-sm text-gray-400'>
              Upload a CSV bank statement to preview your transactions.
            </p>
          </div>

          <label
            htmlFor='statement-file'
            className='flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-700 px-6 py-10 transition hover:border-gray-500 hover:bg-gray-800/40'
          >
            <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800'>
              <span className='text-xl'>↑</span>
            </div>

            {file ? (
              <>
                <p className='font-medium text-white'>{file.name}</p>
                <p className='mt-1 text-sm text-gray-400'>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <p className='font-medium text-white'>Choose a CSV file</p>
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
              className='hidden'
            />
          </label>

          <div className='mt-4 flex justify-end'>
            <button
              type='button'
              onClick={handleParse}
              disabled={!file || isParsing}
              className='rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40'
            >
              {isParsing ? 'Parsing...' : 'Upload & Preview'}
            </button>
          </div>
        </div>
        {validRows.length > 0 && (
          <div className='mt-8 overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40'>
            <div className='border-b border-gray-800 px-6 py-4'>
              <h2 className='font-semibold'>Valid Transactions</h2>
              <p className='text-sm text-gray-400'>
                {validRows.length} transactions ready for review
              </p>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm'>
                <thead className='bg-gray-900'>
                  <tr>
                    <th className='px-6 py-3 font-medium text-gray-400'>
                      Date
                    </th>
                    <th className='px-6 py-3 font-medium text-gray-400'>
                      Description
                    </th>
                    <th className='px-6 py-3 text-right font-medium text-gray-400'>
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {validRows.map((row, index) => (
                    <tr key={index} className='border-t border-gray-800'>
                      <td className='px-6 py-4 text-gray-300'>
                        {new Date(row.date).toLocaleDateString()}
                      </td>

                      <td className='px-6 py-4 text-white'>
                        {row.description}
                      </td>

                      <td className='px-6 py-4 text-right font-medium'>
                        {row.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {errors.length > 0 && (
          <div className='mt-8'>
            <h2 className='text-xl font-semibold mb-4'>Import Errors</h2>

            <div className='space-y-2'>
              {errors.map((error, index) => (
                <div
                  key={index}
                  className='rounded-md border border-red-800 p-3'
                >
                  {error.rowNumber && (
                    <span className='font-medium'>Row {error.rowNumber}: </span>
                  )}

                  <span>{error.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          type='button'
          onClick={handleParse}
          disabled={!file || isParsing}
          className='rounded-md bg-white px-5 py-2 font-semibold text-black disabled:opacity-50'
        >
          {isParsing ? 'Parsing...' : 'Upload & Preview'}
        </button>
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
