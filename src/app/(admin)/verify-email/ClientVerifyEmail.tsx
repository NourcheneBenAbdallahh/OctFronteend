"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/lib/auth.api';

export default function ClientVerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [message, setMessage] = useState('Vérification en cours...');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage('Lien invalide ou manquant.');
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setMessage(res || 'Email vérifié avec succès.');
        setIsSuccess(true);

        setTimeout(() => {
          router.push('/signin');
        }, 3000);
      })
      .catch(() => {
        setMessage('Lien invalide ou expiré.');
        setIsSuccess(false);
      });
  }, [token, router]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100 px-6 dark:bg-gray-900'>
      <div className='bg-white p-10 rounded-3xl shadow-lg text-center max-w-xl w-full dark:bg-white/[0.03] dark:border dark:border-gray-800'>
        <div className='mx-auto flex w-full flex-col'>
          <div className='mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30'>
            <svg className='h-8 w-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.27 7.27c.883.883 2.317.883 3.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
            </svg>
          </div>
          
          <h1 className='text-3xl font-black mb-6 text-gray-900 dark:text-white text-center'>
            Vérification de votre email
          </h1>

          {token ? (
            <>
              <p className={`font-semibold text-lg mb-6 ${isSuccess ? 'text-green-600' : 'text-red-500'}`}>
                {message}
              </p>

              {isSuccess && (
                <p className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
                  Redirection vers la page de connexion...
                </p>
              )}
            </>
          ) : (
            <>
              <p className='text-gray-600 mb-4'>Un email de vérification a été envoyé à :</p>
              <p className='font-bold text-[#00A09D] mb-8 text-lg'>{email || 'Votre adresse email'}</p>
              <div className='space-y-4'>
                <a
                  href='/signin'
                  className='w-full block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-center'
                >
                  Continuer vers la connexion
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

