import { Metadata } from 'next';
import { Suspense } from 'react';
import ClientVerifyEmail from './ClientVerifyEmail';

export const metadata: Metadata = {
  title: 'Vérification email',
  description: 'Email verification page',
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white mx-auto"></div>
      </div>
    }>
      <ClientVerifyEmail />
    </Suspense>
  );
}

