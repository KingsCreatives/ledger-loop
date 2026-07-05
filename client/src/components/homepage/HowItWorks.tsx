'use client';

import { motion } from 'framer-motion';
import { howItWorksSteps } from '@/lib/constants';

export function HowItWorks() {
  return (
    <section className='px-6 max-w-5xl mx-auto'>
      <h2 className='text-3xl font-bold text-center mb-12'>How it works</h2>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
        {howItWorksSteps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            whileHover={{ y: -6, boxShadow: '0 12px 24px rgba(0,0,0,0.3)' }}
            className='p-6 rounded-2xl bg-white/5 border border-white/10 cursor-pointer'
          >
            <span className='text-primary font-bold text-sm'>Step {i + 1}</span>
            <h3 className='text-xl font-bold mt-2 mb-2'>{step.title}</h3>
            <p className='text-gray-400 text-sm'>{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
