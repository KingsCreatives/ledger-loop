'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authConstant } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  const { login } = useAuth();
  const { title, buttonText, loadingText, endpoint, redirectTo, footer } =
    authConstant[mode];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post(endpoint, { email, password });

      if (mode === 'login') {
        login(res.data);
      }

      router.push(redirectTo);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className='min-h-screen bg-[#0d1117] text-white flex items-center justify-center p-6'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold tracking-tight'>LedgerLoop</h1>
          <p className='text-sm text-gray-400 mt-1'>{title}</p>
        </div>

        <div className='space-y-4'>
          <Input
            placeholder='Email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='bg-white/5 border-white/10 h-12 rounded-xl'
          />
          <Input
            placeholder='Password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='bg-white/5 border-white/10 h-12 rounded-xl'
          />

          {error && <p className='text-red-400 text-sm'>{error}</p>}

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className='w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold text-lg text-black transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
          >
            {isLoading ? loadingText : buttonText}
          </Button>

          <p className='text-center text-sm text-gray-400'>
            {footer.text}{' '}
            <a href={footer.href} className='text-primary/90 hover:underline'>
              {footer.linkText}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default AuthForm;
