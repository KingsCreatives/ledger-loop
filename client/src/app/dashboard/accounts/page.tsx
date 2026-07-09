'use client';

import { useState, useEffect } from 'react';
import AccountListItem from '@/components/AccountListItem';
import api from '@/lib/axios';
import { CreateAccountModal } from '@/components/CreateAccountModal';
import Link from 'next/link';

interface AccountWithBalance {
  id: string;
  name: string;
  type: 'ASSETS' | 'LIABILITIES' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
}

const Account = () => {
  const [accountList, setAccountLIst] = useState<AccountWithBalance[]>([]);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/ledger/accounts');
      const accountsWithBalance = await Promise.all(
        response.data.map(async (account: AccountWithBalance) => {
          const balanceResponse = await api.get(
            `/ledger/balance/${account.id}`,
          );
          return { ...account, balance: balanceResponse.data.balance };
        }),
      );
      setAccountLIst(accountsWithBalance);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccountSuccess = () => {
    fetchAccounts();
  };

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-4xl font-extrabold tracking-tight'>Accounts</h1>

          <p className='mt-2 text-gray-400'>Manage all your ledger accounts.</p>
        </div>

        <CreateAccountModal onSuccess={handleCreateAccountSuccess} />
      </header>
      <div className='space-y-4 mt-8'>
        {accountList.map((account) => {
          return (
            <Link href={`/dashboard/accounts/${account.id}`} key={account.id}>
              <AccountListItem
                id={account.id}
                name={account.name}
                type={account.type}
                balance={account.balance}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Account;
