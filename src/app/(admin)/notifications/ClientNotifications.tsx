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

const severityLabels: Record<AlertSeverity, string> = {
  info: 'Info',
  warning: 'Avertissement',
  critical: 'Critique',
};

const statusLabels: Record<AlertStatus, string> = {
  unread: 'Non lue',
  read: 'Lue',
  archived: 'Archivee',
};

const typeLabels: Record<string, string> = {
  LOW_STOCK: 'Stock faible',
  WAREHOUSE_CAPACITY_HIGH: 'Capacite entrepot elevee',
  INVENTORY_ANOMALY: 'Anomalie inventaire',
  SUPPLIER_DELAY: 'Retard fournisseur',
};

interface ClientNotificationsProps {}

export default function ClientNotifications({}: ClientNotificationsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  const totalPages = Math.max(1, Math.ceil(alerts.length / itemsPerPage));
  const start = (currentPage - 1) * itemsPerPage;
  const paginatedAlerts = alerts.slice(start, start + itemsPerPage);
  const readCount = alerts.filter((a) => a.status === 'read').length;
  const archivedCount = alerts.filter((a) => a.status === 'archived').length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
      <div className='mt-6 space-y-6'>
        <div className='rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <p className='text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500'>Centre de notifications</p>
              <h2 className='mt-2 text-2xl font-black text-gray-900 dark:text-white'>
                Alertes systeme
              </h2>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                Suivi des alertes en temps reel avec actions rapides.
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <span className='inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-300'>
                Total: {alerts.length}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className='rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-all'
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          <div className='rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]'>
            <p className='text-[10px] font-black uppercase tracking-widest text-gray-400'>Non lues</p>
            <p className='mt-2 text-2xl font-black text-indigo-600'>{unreadCount}</p>
          </div>
          <div className='rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]'>
            <p className='text-[10px] font-black uppercase tracking-widest text-gray-400'>Lues</p>
            <p className='mt-2 text-2xl font-black text-green-600'>{readCount}</p>
          </div>
          <div className='rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]'>
            <p className='text-[10px] font-black uppercase tracking-widest text-gray-400'>Critiques</p>
            <p className='mt-2 text-2xl font-black text-red-600'>{criticalCount}</p>
          </div>
          <div className='rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]'>
            <p className='text-[10px] font-black uppercase tracking-widest text-gray-400'>Archivees</p>
            <p className='mt-2 text-2xl font-black text-gray-600 dark:text-gray-300'>{archivedCount}</p>
          </div>
        </div>

        <div>
          {alerts.length === 0 ? (
            <div className='rounded-2xl border border-gray-100 bg-white py-14 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]'>
              <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>Aucune alerte</h3>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                Tout est a jour. Pas de nouvelle alerte.
              </p>
            </div>
          ) : (
            <div className='overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-gray-800 dark:bg-white/[0.03]'>
              <div className='overflow-hidden'>
                <table className='w-full'>
                  <thead className='border-b border-gray-200 bg-gray-50/80 text-xs font-black uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400'>
                    <tr>
                      <th className='px-6 py-4 text-left'>Severite</th>
                      <th className='px-6 py-4 text-left'>Type</th>
                      <th className='px-6 py-4 text-left'>Titre</th>
                      <th className='px-6 py-4 text-left'>Statut</th>
                      <th className='px-6 py-4 text-left'>Date</th>
                      <th className='px-6 py-4 text-right'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 text-sm dark:divide-gray-800'>
                    {paginatedAlerts.map((alert) => (
                      <tr key={alert.id} className={`hover:bg-gray-50 dark:hover:bg-white/[0.03] ${alert.status === 'unread' ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}>
                        <td className='px-6 py-4'>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${severityColors[alert.severity]}`}>
                            {severityLabels[alert.severity]}
                          </span>
                        </td>
                        <td className='px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300'>
                          {typeLabels[alert.type] || alert.type.replace(/_/g, ' ')}
                        </td>
                        <td className='px-6 py-4 font-medium text-gray-900 dark:text-white max-w-md truncate' title={alert.title}>
                          {alert.title}
                        </td>
                        <td className='px-6 py-4'>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[alert.status]}`}>
                            {statusLabels[alert.status]}
                          </span>
                        </td>
                        <td className='px-6 py-4 text-gray-500 dark:text-gray-400'>
                          {alert.created_at ? new Date(alert.created_at).toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className='px-6 py-4 text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            {alert.status === 'unread' && (
                              <button
                                onClick={() => handleMarkRead(alert.id)}
                                className='rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300'
                              >
                                Marquer lu
                              </button>
                            )}
                            <button
                              onClick={() => handleArchive(alert.id)}
                              className='rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                            >
                              Archiver
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className='flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800'>
                <p className='text-xs font-semibold text-gray-500 dark:text-gray-400'>
                  Page {currentPage} sur {totalPages}
                </p>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className='rounded-xl border border-gray-200 px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300'
                  >
                    Precedent
                  </button>
                  <button
                    type='button'
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className='rounded-xl border border-gray-200 px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300'
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

