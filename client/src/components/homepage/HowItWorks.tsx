import { howItWorksSteps } from "@/lib/constants";

export function HowItWorks() {
  return (
    <section className=' px-6 max-w-5xl mx-auto'>
      <h2 className='text-3xl font-bold text-center mb-12'>How it works</h2>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
        {howItWorksSteps.map((step, i) => (
          <div
            key={step.title}
            className='p-6 rounded-2xl bg-white/5 border border-white/10 cursor-pointer'
          >
            <span className='text-primary font-bold text-sm'>
              Step {i + 1}
            </span>
            <h3 className='text-xl font-bold mt-2 mb-2'>{step.title}</h3>
            <p className='text-gray-400 text-sm'>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
