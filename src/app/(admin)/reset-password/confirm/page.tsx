import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password Confirmation - OCT Admin',
  description: 'Password reset confirmation',
};

export default function ResetPasswordConfirmPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mx-auto flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-green-100 p-4 dark:bg-green-900/30">
            <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Password Reset Successful!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <div className="mt-8 flex gap-4">
            <a
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Go to Login
            </a>
            <a
              href="/"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

