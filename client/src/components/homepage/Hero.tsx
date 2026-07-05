export function Hero() {
  return (
    <section className='flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-6 text-center'>
      <span className='mb-6 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary'>
        100% Free — No credit card required
      </span>

      <h1 className='mb-4 text-5xl font-bold tracking-tight'>
        Stop reconciling manually.
      </h1>

      <p className='mb-2 max-w-xl text-lg text-gray-400'>
        Upload your bank statement and ledger. LedgerLoop matches them for you —
        in minutes, not hours.
      </p>

      <p className='mb-8 text-sm text-gray-500'>
        Built by someone who spent years reconciling vault transactions by hand.
      </p>

      <div className='flex gap-4'>
        <a
          href='/signup'
          className='rounded-full bg-primary px-6 py-3 font-bold text-black transition hover:bg-primary/90'
        >
          Get Started Free
        </a>

        <a
          href='/login'
          className='rounded-full border border-white/20 px-6 py-3 font-bold transition hover:bg-white/10'
        >
          Log In
        </a>
      </div>
    </section>
  );
}
