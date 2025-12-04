import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button, LoadingThunder } from '@/design-system/components';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <LoadingThunder size="xl" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Strkx</h1>
          <p className="text-muted-foreground">Sign in to continue your journey</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={login}
            variant="outline"
            className="w-full flex items-center justify-center gap-3 py-6 text-base"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            By continuing, you agree to our{' '}
            <a href="#" className="underline hover:text-foreground">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
