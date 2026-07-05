'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-[#0d1117] flex items-center justify-center'>
        <p className='text-white'>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

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
      {children}
    </main>
  );
}
