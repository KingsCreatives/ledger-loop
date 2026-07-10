'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-[#0d1117] flex items-center justify-center'>
        <p className='text-white'>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const navLinkClass = (href: string) =>
    `text-sm font-bold px-3 py-1.5 rounded-full transition-colors ${
      pathname === href
        ? 'bg-white/10 text-white'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <main className='min-h-screen bg-[#0d1117] text-white p-6 md:p-12'>
      <header className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-12 max-w-6xl mx-auto'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>LedgerLoop</h1>
          <p className='text-sm text-gray-400'>Welcome, {user.email}</p>
        </div>

        <div className='flex flex-wrap items-center justify-between gap-4 md:justify-end'>
          <nav className='flex items-center gap-2'>
            <Link href='/dashboard' className={navLinkClass('/dashboard')}>
              Dashboard
            </Link>
            <Link
              href='/dashboard/accounts'
              className={navLinkClass('/dashboard/accounts')}
            >
              Accounts
            </Link>
          </nav>

          <div className='flex items-center gap-4'>
            <button
              onClick={handleLogout}
              className='rounded-full border border-white/20 px-4 py-2 text-sm font-bold transition hover:bg-white/10 cursor-pointer'
            >
              Sign out
            </button>
            <div className='h-10 w-10 rounded-full bg-primary flex items-center justify-center font-bold shadow-lg shadow-primary/20 cursor-pointer transform transition-all hover:scale-105'>
              {user.email[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
