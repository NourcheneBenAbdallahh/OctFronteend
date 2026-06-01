import { Suspense } from 'react';
import ClientNotifications from './ClientNotifications';

export const metadata = {
  title: 'Notifications',
  description: 'Manage system alerts and notifications',
};

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[400px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"></div></div>}>
      <ClientNotifications />
    </Suspense>
  );
}

