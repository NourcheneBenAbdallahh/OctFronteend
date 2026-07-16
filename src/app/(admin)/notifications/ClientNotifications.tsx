"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SortableTh } from '@/components/ui/SortableTableHeader';
import { useTableSort } from '@/hooks/useTableSort';
import type { SortColumn } from '@/lib/tableSort';
import { Alert, AlertSeverity, AlertStatus } from '@/lib/notifications.api';
import { hasAlertTarget, navigateToAlert, getSeverityLabel, getStatusLabel, getAlertTypeLabel } from '@/lib/notifications.helpers';
import { useLiveAlertsContext } from '@/context/LiveAlertsContext';
import { ResponsiveTableWrap } from '@/components/ui/ResponsiveTableWrap';
import { BreadcrumbNav } from '@/components/common/BreadcrumbNav';
import { BREADCRUMBS } from '@/lib/breadcrumbs';

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

const ALERT_SORT_COLUMNS: Record<string, SortColumn<Alert>> = {
  severity: { accessor: (a) => a.severity, type: 'string' },
  title: { accessor: (a) => a.title, type: 'string' },
  status: { accessor: (a) => a.status, type: 'string' },
  date: { accessor: (a) => a.created_at, type: 'date' },
};

type AlertFilter = 'all' | 'unread' | 'read' | 'critical' | 'archived';

const FILTER_LABELS: Record<AlertFilter, string> = {
  all: 'Toutes',
  unread: 'Non lues',
  read: 'Lues',
  critical: 'Urgentes',
  archived: 'Archivées',
};

function matchesFilter(alert: Alert, filter: AlertFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'unread') return alert.status === 'unread';
  if (filter === 'read') return alert.status === 'read';
  if (filter === 'archived') return alert.status === 'archived';
  return alert.severity === 'critical';
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) {
    return "a l'instant";
  }

  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) {
    return `il y a ${diffSecs} ${diffSecs > 1 ? "secondes" : "seconde"}`;
  }

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) {
    return `il y a ${diffMins} ${diffMins > 1 ? "minutes" : "minute"}`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `il y a ${diffHours} ${diffHours > 1 ? "heures" : "heure"}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `il y a ${diffDays} ${diffDays > 1 ? "jours" : "jour"}`;
}

export default function ClientNotifications() {
  const router = useRouter();
  const {
    alerts,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    archiveAlert,
  } = useLiveAlertsContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<AlertFilter>('all');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const itemsPerPage = 8;

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleArchive = async (id: string) => {
    await archiveAlert(id);
  };

  const handleOpenAlert = async (alert: Alert) => {
    setSelectedAlertId(alert.id);

    if (hasAlertTarget(alert)) {
      if (alert.status === 'unread') {
        await handleMarkRead(alert.id);
      }
      navigateToAlert(alert, router);
      return;
    }
  };

  const toggleFilter = (filter: AlertFilter) => {
    setActiveFilter((current) => (current === filter ? 'all' : filter));
    setCurrentPage(1);
    setSelectedAlertId(null);
  };

  const { sortKey, sortDirection, toggleSort, sortRows } = useTableSort(ALERT_SORT_COLUMNS);
  const handleSort = (key: string) => {
    toggleSort(key);
    setCurrentPage(1);
  };
  const sortedAlerts = useMemo(() => sortRows(alerts), [alerts, sortRows]);
  const filteredAlerts = useMemo(
    () => sortedAlerts.filter((alert) => matchesFilter(alert, activeFilter)),
    [sortedAlerts, activeFilter]
  );
  const selectedAlert = useMemo(
    () => filteredAlerts.find((alert) => alert.id === selectedAlertId) ?? null,
    [filteredAlerts, selectedAlertId]
  );

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const start = (page - 1) * itemsPerPage;
  const paginatedAlerts = filteredAlerts.slice(start, start + itemsPerPage);
  const readCount = alerts.filter((a) => a.status === 'read').length;
  const archivedCount = alerts.filter((a) => a.status === 'archived').length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  if (loading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white'></div>
      </div>
    );
  }

  return (
    <div>
      <div className='space-y-6'>
        <div className='rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <BreadcrumbNav items={BREADCRUMBS.notifications} className='mb-3' />
              <p className='text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500'>Centre de notifications</p>
              <h2 className='mt-2 text-2xl font-black text-gray-900 dark:text-white'>
                Alertes systeme
              </h2>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                Mises a jour en temps reel via Mercure Hub.
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <span className='inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-300'>
                Total: {alerts.length}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={() => void handleMarkAllRead()}
                  className='rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-all'
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          {([
            ['unread', unreadCount, 'text-indigo-600', 'border-indigo-200 ring-indigo-100'],
            ['read', readCount, 'text-green-600', 'border-green-200 ring-green-100'],
            ['critical', criticalCount, 'text-red-600', 'border-red-200 ring-red-100'],
            ['archived', archivedCount, 'text-gray-600 dark:text-gray-300', 'border-gray-200 ring-gray-100'],
          ] as const).map(([filter, count, countClass, activeRing]) => (
            <button
              key={filter}
              type='button'
              onClick={() => toggleFilter(filter)}
              className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] ${
                activeFilter === filter
                  ? `ring-2 ${activeRing} ${activeRing.replace('ring-', 'border-')}`
                  : 'border-gray-100'
              }`}
            >
              <p className='text-[10px] font-black uppercase tracking-widest text-gray-400'>
                {FILTER_LABELS[filter]}
              </p>
              <p className={`mt-2 text-2xl font-black ${countClass}`}>{count}</p>
              {activeFilter === filter && (
                <p className='mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400'>
                  Filtre actif
                </p>
              )}
            </button>
          ))}
        </div>

        {activeFilter !== 'all' && (
          <div className='flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-700'>
            <span>
              Affichage : <strong>{FILTER_LABELS[activeFilter]}</strong> ({filteredAlerts.length})
            </span>
            <button
              type='button'
              onClick={() => toggleFilter(activeFilter)}
              className='text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800'
            >
              Tout afficher
            </button>
          </div>
        )}

        {selectedAlert && !hasAlertTarget(selectedAlert) && (
          <div className='rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <p className='text-[10px] font-black uppercase tracking-widest text-indigo-500'>Détail de l&apos;alerte</p>
                <h3 className='mt-2 text-lg font-black text-gray-900 dark:text-white'>{selectedAlert.title}</h3>
              </div>
              <div className='flex flex-wrap gap-2'>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${severityColors[selectedAlert.severity]}`}>
                  {getSeverityLabel(selectedAlert.severity)}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[selectedAlert.status]}`}>
                  {getStatusLabel(selectedAlert.status)}
                </span>
              </div>
            </div>
            <p className='mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300'>
              {selectedAlert.message}
            </p>
            <p className='mt-4 text-xs font-semibold uppercase tracking-wider text-gray-400'>
              {getAlertTypeLabel(selectedAlert.type)}
            </p>
          </div>
        )}

        <div>
          {filteredAlerts.length === 0 ? (
            <div className='rounded-2xl border border-gray-100 bg-white py-14 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]'>
              <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                {activeFilter === 'all' ? 'Aucune alerte' : `Aucune alerte ${FILTER_LABELS[activeFilter].toLowerCase()}`}
              </h3>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                Tout est a jour. Pas de nouvelle alerte.
              </p>
            </div>
          ) : (
            <div className='overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-gray-800 dark:bg-white/[0.03]'>
              <ResponsiveTableWrap showScrollHint={paginatedAlerts.length > 0}>
                <table className='w-full min-w-[760px]'>
                  <thead className='border-b border-gray-200 bg-gray-50/80 text-xs font-black uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400'>
                    <tr>
                      <SortableTh columnKey="severity" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-gray-500">Libelle</SortableTh>
                      <SortableTh columnKey="title" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-gray-500">Titre</SortableTh>
                      <SortableTh columnKey="status" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-gray-500">Statut</SortableTh>
                      <SortableTh columnKey="date" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-gray-500">Date</SortableTh>
                      <th className='px-6 py-4 text-right'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 text-sm dark:divide-gray-800'>
                    {paginatedAlerts.map((alert) => (
                      <tr
                        key={alert.id}
                        onClick={() => void handleOpenAlert(alert)}
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                          selectedAlertId === alert.id ? 'bg-indigo-50/60 dark:bg-indigo-900/10' : ''
                        } ${alert.status === 'unread' ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                      >
                        <td className='px-6 py-4'>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${severityColors[alert.severity]}`}>
                            {getSeverityLabel(alert.severity)}
                          </span>
                        </td>
                        <td className='px-6 py-4 font-medium text-gray-900 dark:text-white max-w-md truncate' title={alert.title}>
                          {alert.title}
                        </td>
                        <td className='px-6 py-4'>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[alert.status]}`}>
                            {getStatusLabel(alert.status)}
                          </span>
                        </td>
                        <td className='px-6 py-4 text-gray-500 dark:text-gray-400'>
                          {alert.created_at ? formatRelativeDate(alert.created_at) : '-'}
                        </td>
                        <td className='px-6 py-4 text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            {hasAlertTarget(alert) && (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleOpenAlert(alert);
                                }}
                                className='rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300'
                              >
                                Voir
                              </button>
                            )}
                            {alert.status === 'unread' && (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleMarkRead(alert.id);
                                }}
                                className='rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300'
                              >
                                Marquer lu
                              </button>
                            )}
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleArchive(alert.id);
                              }}
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
              </ResponsiveTableWrap>

              <div className='flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800'>
                <p className='text-xs font-semibold text-gray-500 dark:text-gray-400'>
                  Page {page} sur {totalPages}
                </p>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => setCurrentPage((p) => Math.max(1, Math.min(p, totalPages) - 1))}
                    disabled={page === 1}
                    className='rounded-xl border border-gray-200 px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300'
                  >
                    Precedent
                  </button>
                  <button
                    type='button'
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1))}
                    disabled={page === totalPages}
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
