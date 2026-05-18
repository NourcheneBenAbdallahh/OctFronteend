import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Reset Password - OCT Admin',
  description: 'Reset your password',
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mx-auto flex w-full flex-col">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white text-center">Reset Password</h1>
          <p className="mb-8 text-sm text-gray-600 dark:text-gray-400 text-center">
            Enter your email address and we will send you a link to reset your password.
          </p>
          
          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-white/[0.03] dark:placeholder-gray-400 dark:focus:ring-blue-400"
                placeholder="name@company.com"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Send Reset Link
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <Link 
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

