'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/axios';

interface Props {
  onSuccess: () => void;
}

export const CreateAccountModal = ({ onSuccess }: Props) => {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');

  const handleSubmit = async () => {
    if (!name || !type) return;

    const payload = {
      name,
      type,
    };

    setIsSaving(true);

    try {
      await api.post('/ledger/accounts', payload);
      setOpen(false);
      setName('');
      setType('');
      onSuccess();
    } catch (error) {
      console.error('Failed to create account', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition cursor-pointer'>
          Create Account
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-[#0d1117] text-white border-white/10 sm:max-w-106.25 rounded-3xl'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold'>New Account</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='space-y-2 cursor-pointer'>
            <label className='text-xs uppercase text-gray-400 tracking-widest font-semibold'>
              Account Name
            </label>
            <Input
              placeholder='e.g. Operating Cash'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='bg-white/5 border-white/10 rounded-xl h-12 focus:ring-primary focus:border-primary/90'
            />
          </div>

          <div className='grid grid-cols-1 gap-4'>
            <Select onValueChange={setType}>
              <SelectTrigger className='bg-white/5 border-white/10 rounded-xl h-12'>
                <SelectValue placeholder='Select account type' />
              </SelectTrigger>

              <SelectContent className='bg-[#1a1f26] border-white/10 text-white'>
                <SelectItem value='ASSETS'>Assets</SelectItem>
                <SelectItem value='LIABILITIES'>Liabilities</SelectItem>
                <SelectItem value='EQUITY'>Equity</SelectItem>
                <SelectItem value='REVENUE'>Revenue</SelectItem>
                <SelectItem value='EXPENSE'>Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className='w-full bg-primary hover:bg-primary/90 h-12 rounded-xl font-bold text-lg text-black'
          >
            {isSaving ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
