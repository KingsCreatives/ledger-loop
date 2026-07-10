interface AccountListItemProps {
  id: string;
  name: string;
  type: 'ASSETS' | 'LIABILITIES' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
}

export const authConstant = {
  login: {
    title: 'Log in to your account',
    buttonText: 'Log In',
    loadingText: 'Logging in...',
    endpoint: '/auth/login',
    redirectTo: '/dashboard',
    footer: {
      text: "Don't have an account?",
      linkText: 'Sign up',
      href: '/signup',
    },
  },

  signup: {
    title: 'Create your account',
    buttonText: 'Sign Up',
    loadingText: 'Creating account...',
    endpoint: '/auth/signup',
    redirectTo: '/login',
    footer: {
      text: 'Already have an account?',
      linkText: 'Log in',
      href: '/login',
    },
  },
};

export const howItWorksSteps = [
  {
    title: 'Ingest',
    desc: 'Upload your bank statement and internal ledger as CSV or JSON.',
  },
  {
    title: 'Match',
    desc: 'LedgerLoop automatically matches transactions by amount, date, and reference.',
  },
  {
    title: 'Report',
    desc: 'Get a clear reconciliation report with flagged discrepancies.',
  },
];

export const typeStyles: Record<AccountListItemProps['type'], string> = {
  ASSETS: 'bg-emerald-500/15 text-emerald-400',
  LIABILITIES: 'bg-red-500/15 text-red-400',
  EQUITY: 'bg-blue-500/15 text-blue-400',
  REVENUE: 'bg-purple-500/15 text-purple-400',
  EXPENSE: 'bg-amber-500/15 text-amber-400',
};
