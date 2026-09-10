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
        <input type='file' accept='.csv,text/csv' onChange={handleFileChange} />
        {validRows.length > 0 && (
          <div className='mt-8'>
            <h2 className='text-xl font-semibold mb-4'>Valid Transactions</h2>

            <div className='overflow-x-auto'>
              <table className='w-full text-left'>
                <thead>
                  <tr className='border-b border-gray-700'>
                    <th className='py-3'>Date</th>
                    <th className='py-3'>Description</th>
                    <th className='py-3'>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {validRows.map((row, index) => (
                    <tr key={index} className='border-b border-gray-800'>
                      <td className='py-3'>{row.date}</td>
                      <td className='py-3'>{row.description}</td>
                      <td className='py-3'>{row.amount}</td>
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
