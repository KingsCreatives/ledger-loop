'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BalanceCard from '@/components/BalanceCard';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [cashAccountId, setCashAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get('/ledger/accounts')
      .then((res) => {
        const cash = res.data.find((a: any) => a.type === 'ASSETS');
        if (cash) setCashAccountId(cash.id);
      })
      .catch(console.error);
  }, [user]);

  const handleTransactionSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-[#0d1117] flex items-center justify-center'>
        <p className='text-white'>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <main className='min-h-screen bg-[#0d1117] text-white p-6 md:p-12'>
      <header className='flex justify-between items-center mb-12 max-w-6xl mx-auto'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>LedgerLoop</h1>
          <p className='text-sm text-gray-400'>Welcome, {user.email}</p>
        </div>

        <div className='flex items-center gap-4'>
          <button
            onClick={handleLogout}
            className='text-sm text-gray-400 hover:text-white transition-colors'
          >
            Sign out
          </button>
          <div className='h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold shadow-lg shadow-blue-500/20'>
            {user.email[0].toUpperCase()}
          </div>
        </div>
      </header>
      <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='col-span-1 md:col-span-2 p-8 rounded-3xl bg-linear-to-br from-white/10 to-white/5 border border-white/10 shadow-2xl transition-all hover:border-white/20'>
          <p className='text-sm font-medium text-gray-400 uppercase tracking-widest opacity-70'>
            Operating Cash
          </p>

          {cashAccountId && (
            <BalanceCard
              accountId={cashAccountId}
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
          <div>
            <p className='text-sm font-medium text-gray-400 uppercase tracking-widest opacity-70'>
              Equity
            </p>
            <h3 className='text-2xl font-bold mt-2'>$10,000.00</h3>
          </div>
          <div className='mt-6'>
            <div className='flex justify-between text-xs mb-2 text-gray-400'>
              <span>Utilization</span>
              <span>85%</span>
            </div>
            <div className='h-1.5 w-full bg-white/10 rounded-full overflow-hidden'>
              <div
                className='h-full bg-blue-500 transition-all duration-1000'
                style={{ width: '85%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
