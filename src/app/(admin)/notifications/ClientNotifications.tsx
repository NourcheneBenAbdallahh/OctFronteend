"use client";

import { useState, useEffect, useCallback } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { getAlerts, getUnreadAlertsCount, markAlertAsRead, markAllAlertsAsRead, archiveAlert, Alert, AlertSeverity, AlertStatus } from '@/lib/notifications.api';

const severityColors: Record<AlertSeverity, string> = {
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusColors: Record<AlertStatus, string> = {
  unread: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  read: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

interface ClientNotificationsProps {}

export default function ClientNotifications({}: ClientNotificationsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsData, countData] = await Promise.all([getAlerts(), getUnreadAlertsCount()]);
      setAlerts(alertsData);
      setUnreadCount(countData);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleMarkRead = async (id: string) => {
    try {
      await markAlertAsRead(id);
      setAlerts(alerts.map((alert) => 
        alert.id === id ? { ...alert, status: 'read' as AlertStatus, read_at: new Date().toISOString() } : alert
      ));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsAsRead();
      setAlerts(alerts.map((alert) => ({ ...alert, status: 'read' as AlertStatus, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveAlert(id);
      setAlerts(alerts.filter((alert) => alert.id !== id));
    } catch (error) {
      console.error('Failed to archive:', error);
    }
  };

  if (loading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white'></div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle='Notifications' />
      <div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12'>
        <div className='lg:col-span-12'>
          <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl'>
              System Alerts ({alerts.length})
            </h2>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              {unreadCount > 0 && (
                <span className='inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  {unreadCount} unread
                </span>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>

        <div className='lg:col-span-12'>
          {alerts.length === 0 ? (
            <div className='text-center py-12'>
              <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>No alerts</h3>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                All caught up! No new system alerts.
              </p>
            </div>
          ) : (
            <div className='rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]'>
              <div className='overflow-hidden'>
                <table className='w-full'>
                  <thead className='border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400'>
                    <tr>
                      <th className='px-6 py-4 text-left'>Severity</th>
                      <th className='px-6 py-4 text-left'>Type</th>
                      <th className='px-6 py-4 text-left'>Title</th>
                      <th className='px-6 py-4 text-left'>Status</th>
                      <th className='px-6 py-4 text-left'>Date</th>
                      <th className='px-6 py-4 text-right'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 text-sm dark:divide-gray-800'>
                    {alerts.map((alert) => (
                      <tr key={alert.id} className='hover:bg-gray-50 dark:hover:bg-white/[0.03]'>
                        <td className='px-6 py-4'>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${severityColors[alert.severity]}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className='px-6 py-4 font-mono text-xs uppercase'>{alert.type}</td>
                        <td className='px-6 py-4 font-medium text-gray-900 dark:text-white max-w-md truncate' title={alert.title}>
                          {alert.title}
                        </td>
                        <td className='px-6 py-4'>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[alert.status]}`}>
                            {alert.status.toUpperCase()}
                          </span>
                        </td>
                        <td className='px-6 py-4 text-gray-500 dark:text-gray-400'>
                          {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className='px-6 py-4 text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            {alert.status === 'unread' && (
                              <button
                                onClick={() => handleMarkRead(alert.id)}
                                className='text-blue-600 hover:text-blue-900 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300'
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              onClick={() => handleArchive(alert.id)}
                              className='text-gray-400 hover:text-gray-600 text-sm font-medium dark:text-gray-500 dark:hover:text-gray-300'
                            >
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

