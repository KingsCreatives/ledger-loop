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
