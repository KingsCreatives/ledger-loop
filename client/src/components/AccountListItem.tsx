import { ArrowBigRight } from 'lucide-react';

interface AccountListItemProps {
  id: string;
  name: string;
  type: 'ASSETS' | 'LIABILITIES' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
}

const AccountListItem = ({ id, name, type, balance }: AccountListItemProps) => {
  return (
    <div className='rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-200 p-6 cursor-pointer'>
      <div className='flex items-start justify-between'>
        <div>
          <h3 className='text-xl font-bold'>{name}</h3>

          <span className='inline-flex mt-3 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold tracking-wider text-primary'>
            {type}
          </span>
        </div>

        <div className='text-right'>
          <p className='text-sm text-gray-400 uppercase tracking-widest'>
            Balance
          </p>

          <p className='text-2xl font-bold mt-2'>
            GHS {(balance / 100).toLocaleString()}
          </p>
        </div>
      </div>

      <div className='mt-6 flex justify-end text-gray-400'>
        <ArrowBigRight className='h-5 w-5 transition-transform group-hover:translate-x-1' />
      </div>
    </div>
  );
};

export default AccountListItem;
