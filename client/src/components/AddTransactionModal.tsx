'use client';

import { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AccountSelector } from './AccountSelector';

interface Props {
  onSuccess: () => void; 
}

export const AddTransactionModal = ({ onSuccess }: Props) => {

  const [open, setOpen] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');

  const handleSubmit = async () => {
    if (!description || !amount || !fromAccount || !toAccount) return;

    setIsSaving(true);

    const amountInCents = Math.round(parseFloat(amount) * 100);

    const payload = {
      description,
      date: new Date().toISOString(),
      lines: [
        { accountId: toAccount, amount: amountInCents, type: 'DEBIT' },
        { accountId: fromAccount, amount: amountInCents, type: 'CREDIT' },
      ],
    };

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ledger`, payload);
      setOpen(false); 
      setDescription(''); 
      setAmount('');
      onSuccess(); 
    } catch (error) {
      console.error('Transaction failed', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition'>
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-[#0d1117] text-white border-white/10 sm:max-w-106.25 rounded-3xl'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold'>
            New Transaction
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='space-y-2'>
            <label className='text-xs uppercase text-gray-400 tracking-widest font-semibold'>
              Details
            </label>
            <Input
              placeholder='e.g. Monthly Rent'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='bg-white/5 border-white/10 rounded-xl h-12 focus:ring-blue-500'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-xs uppercase text-gray-400 tracking-widest font-semibold'>
              Amount
            </label>
            <Input
              type='number'
              placeholder='0.00'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='bg-white/5 border-white/10 rounded-xl h-12 text-2xl font-bold'
            />
          </div>

          <div className='grid grid-cols-1 gap-4'>
            <AccountSelector label='Pay From' onSelect={setFromAccount} />
            <AccountSelector label='Category / To' onSelect={setToAccount} />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className='w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold text-lg transition-all active:scale-95'
          >
            {isSaving ? 'Syncing with Vault...' : 'Save Transaction'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
