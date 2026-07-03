'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';

interface Account {
  id: string;
  name: string;
}

interface AccountSelectorProps {
  label: string;
  placeholder?: string;
  onSelect: (accountId: string) => void;
}

export const AccountSelector = ({
  label,
  placeholder,
  onSelect,
}: AccountSelectorProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get('/ledger/accounts');
        setAccounts(response.data);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      }
    };
    fetchAccounts();
  }, []);

  return (
    <div className='space-y-2'>
      <Label className='text-gray-400 text-xs uppercase tracking-widest'>
        {label}
      </Label>
      <Select onValueChange={onSelect}>
        <SelectTrigger className='w-full bg-white/5 border-white/10 rounded-xl focus:ring-blue-500'>
          <SelectValue placeholder={placeholder || 'Select account'} />
        </SelectTrigger>
        <SelectContent className='bg-[#1a1f26] border-white/10 text-white'>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
