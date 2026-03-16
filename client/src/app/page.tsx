import BalanceCard from "./components/BalanceCard";

export default function Home() {
  return (
    <main className='min-h-screen bg-[#0d1117] text-white p-6 md:p-12'>
      {/* Top Navigation / Header */}
      <header className='flex justify-between items-center mb-12 max-w-6xl mx-auto'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>LedgerLoop</h1>
          <p className='text-sm text-gray-400'>Good morning, Accountant</p>
        </div>
        <div className='h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold'>
          C
        </div>
      </header>

      <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Main Balance Card - The "Revolut" Style */}
        <div className='col-span-1 md:col-span-2 p-8 rounded-3xl bg-linear-to-br from-white/10 to-white/5 border border-white/10 shadow-2xl'>
          <p className='text-sm font-medium text-gray-400 uppercase tracking-widest'>
            Operating Cash
          </p>
          {/* <div className='mt-4 flex items-baseline gap-2'>
            <span className='text-5xl font-extrabold tracking-tighter'>
              $8,500.00
            </span>
            <span className='text-green-400 text-sm font-bold'>+2.5%</span>
          </div> */}
          <BalanceCard/>

          <div className='mt-8 flex gap-3'>
            <button className='px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition'>
              Add Transaction
            </button>
            <button className='px-6 py-2.5 bg-white/10 border border-white/10 rounded-full font-bold text-sm hover:bg-white/20 transition'>
              Details
            </button>
          </div>
        </div>

        {/* Small Side Card */}
        <div className='p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-400 uppercase tracking-widest'>
              Equity
            </p>
            <h3 className='text-2xl font-bold mt-2'>$10,000.00</h3>
          </div>
          <div className='h-1 w-full bg-white/10 rounded-full overflow-hidden'>
            <div className='h-full bg-blue-500 w-[85%]'></div>
          </div>
        </div>
      </div>
    </main>
  );
}
