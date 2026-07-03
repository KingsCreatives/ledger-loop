export const authConstant = {
  login: {
    title: 'Sign in to your account',
    buttonText: 'Sign In',
    loadingText: 'Signing in...',
    endpoint: '/auth/login',
    redirectTo: '/',
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
      linkText: 'Sign in',
      href: '/login',
    },
  },
};
