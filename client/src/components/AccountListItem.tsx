import { ArrowRight } from 'lucide-react';
import { typeStyles } from '@/lib/constants';

interface AccountListItemProps {
  id: string;
  name: string;
  type: 'ASSETS' | 'LIABILITIES' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
}

const AccountListItem = ({ id, name, type, balance }: AccountListItemProps) => {
  return (
    <div className='group flex items-center justify-between rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-200 p-6 cursor-pointer'>
      <div>
        <h3 className='text-xl font-bold'>{name}</h3>

        <span
          className={`inline-flex mt-3 rounded-full px-3 py-1 text-xs font-semibold tracking-wider ${typeStyles[type]}`}
        >
          {type}
        </span>
      </div>

      <div className='flex items-center gap-6'>
        <div className='text-right'>
          <p className='text-sm text-gray-400 uppercase tracking-widest'>
            Balance
          </p>
          <p className='text-2xl font-bold mt-2'>
            GHS {(balance / 100).toLocaleString()}
          </p>
        </div>

        <ArrowRight className='h-5 w-5 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white' />
      </div>
    </div>
  );
};

export default AccountListItem;
