'use client';

import React, { useState, useEffect } from 'react';
import AccountListItem from '@/components/AccountListItem';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';

interface AccountWithBalance {
  id: string;
  name: string;
  type: 'ASSETS' | 'LIABILITIES' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
}

const Account = () => {
  const [accountList, setAccountLIst] = useState<AccountWithBalance[]>([]);

  useEffect(() => {
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
        console.log('Accounts with balance:', accountsWithBalance);
        setAccountLIst(accountsWithBalance);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      }
    };
    fetchAccounts();
  }, []);

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-4xl font-extrabold tracking-tight'>Accounts</h1>

          <p className='mt-2 text-gray-400'>Manage all your ledger accounts.</p>
        </div>

        <Button className='rounded-full bg-primary px-6 text-black font-bold hover:bg-primary/90'>
          + Create Account
        </Button>
      </header>
      <div className='space-y-4 mt-8'>
        {accountList.map((account) => {
          return (
            <AccountListItem
              key={account.id}
              id={account.id}
              name={account.name}
              type={account.type}
              balance={account.balance}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Account;
