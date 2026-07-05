'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className='flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center px-6 text-center'>
      <motion.span
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='mb-6 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary'
      >
        100% Free — No credit card required
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className='mb-4 text-5xl font-bold tracking-tight'
      >
        Stop reconciling manually.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className='mb-2 max-w-xl text-lg text-gray-400'
      >
        Upload your bank statement and ledger. LedgerLoop matches them for you —
        in minutes, not hours.
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className='mb-8 text-sm text-gray-500'
      >
        Built by someone who spent years reconciling vault transactions by hand.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className='flex gap-4'
      >
        <Link
          href='/signup'
          className='rounded-full bg-primary px-6 py-3 font-bold text-black transition hover:bg-primary/90'
        >
          Get Started Free
        </Link>

        <Link
          href='/login'
          className='rounded-full border border-white/20 px-6 py-3 font-bold transition hover:bg-white/10'
        >
          Log In
        </Link>
      </motion.div>
    </section>
  );
}
