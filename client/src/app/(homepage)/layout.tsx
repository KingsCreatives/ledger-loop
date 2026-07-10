import Link from 'next/link';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-[#0d1117] text-white'>
      <header className='border-b border-white/10'>
        <nav className='max-w-6xl mx-auto flex items-center justify-between px-6 py-4'>
          <Link href='/' className='text-lg font-bold tracking-tight'>
            LedgerLoop
          </Link>
          <div className='flex items-center gap-6'>
            <Link
              href='/login'
              className='rounded-full border border-white/20 px-4 py-2 text-sm font-bold transition hover:bg-white/10 cursor-pointer'
            >
              Log In
            </Link>
            <Link
              href='/signup'
              className='px-4 py-2 bg-emerald-500 text-black rounded-full text-sm font-bold hover:bg-emerald-400 transition'
            >
              Get Started Free
            </Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
