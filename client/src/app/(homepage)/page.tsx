import { Hero } from '@/components/homepage/Hero';
import { HowItWorks } from '@/components/homepage/HowItWorks';
import { FinalCTA } from '@/components/homepage/CTA';

export default function Home() {
  return (
    <main className='relative min-h-screen overflow-hidden bg-[#0d1117] text-white flex flex-col items-center text-center'>
      <div className='pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl' />
      <div className='pointer-events-none absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl' />

      <div className='relative z-10 flex flex-col items-center w-full'>
        <Hero />
        <HowItWorks />
        <FinalCTA />
      </div>
    </main>
  );
}
