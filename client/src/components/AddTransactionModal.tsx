'use client';

import { useState } from 'react';
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
import api from '@/lib/axios';
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

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setFromAccount('');
    setToAccount('');
  };

  const handleSubmit = async () => {
    if (!description || !amount || !fromAccount || !toAccount) return;

    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (!Number.isFinite(amountInCents) || amountInCents < 1) {
      return;
    }

    setIsSaving(true);

    const payload = {
      description,
      date: new Date().toISOString(),
      lines: [
        { accountId: toAccount, amount: amountInCents, type: 'DEBIT' },
        { accountId: fromAccount, amount: amountInCents, type: 'CREDIT' },
      ],
    };

    try {
      await api.post('/ledger', payload);
      setOpen(false);
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Transaction failed', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);

        if (!isOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className='px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition cursor-pointer'>
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
          <div className='space-y-2 cursor-pointer'>
            <label className='text-xs uppercase text-gray-400 tracking-widest font-semibold'>
              Details
            </label>
            <Input
              placeholder='e.g. Monthly Rent'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='bg-white/5 border-white/10 rounded-xl h-12 focus:ring-primary focus:border-primary/90'
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
              className='bg-white/5 border-white/10 rounded-xl h-12 text-2xl font-bold  focus:ring-primary focus:border-primary/90'
            />
          </div>

          <div className='grid grid-cols-1 gap-4'>
            <AccountSelector label='Pay From' onSelect={setFromAccount} />
            <AccountSelector label='Category / To' onSelect={setToAccount} />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className='w-full bg-primary hover:bg-primary/90 h-12 rounded-xl font-bold text-lg transition-all active:scale-95 text-black'
          >
            {isSaving ? 'Syncing with Vault...' : 'Save Transaction'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
