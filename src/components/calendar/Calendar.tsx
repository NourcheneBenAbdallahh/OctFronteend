"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventClickArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import {
  canQueryCommandesList,
  filterCommandesForCalendarUser,
  isAdminUser,
} from "@/lib/access";
import { listCommandes } from "@/lib/commandes.api";
import { fetchAllFactures } from "@/lib/bi.data";
import { useAuthStore } from "@/store/useAuthStore";
import type { Commande, CommandeStatut } from "@/types/commandes";
import type { Facture } from "@/types/facture";
import frLocale from "@fullcalendar/core/locales/fr";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    kind: "commande" | "facture";
    commande?: Commande;
    facture?: Facture;
  };
}

const statutToCalendarColor = (statut: string): string => {
  switch (statut) {
    case "BROUILLON":
      return "Indigo";
    case "VALIDEE":
      return "Blue";
    case "LIVREP":
      return "Amber";
    case "LIVREC":
      return "Green";
    case "ANNULEE":
      return "Red";
    default:
      return "Slate";
  }
};

const statutFactureToCalendarColor = (statut: string): string => {
  switch (statut) {
    case "BROUILLON":
      return "Indigo";
    case "VALIDE":
      return "Blue";
    case "PAYE":
      return "Green";
    case "ANNULE":
      return "Red";
    default:
      return "Slate";
  }
};

const formatDateOnly = (value?: string | null): string => {
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0] : value;
};

const buildCommandeEvent = (commande: Commande): CalendarEvent => {
  const statut = (commande.statut || "BROUILLON") as CommandeStatut | string;

  return {
    id: `cmd-${commande.id}`,
    title: `${commande.numero_commande} • ${commande.quantite}`,
    start: formatDateOnly(commande.date_livraison_prevue),
    allDay: true,
    extendedProps: {
      calendar: statutToCalendarColor(statut),
      kind: "commande",
      commande,
    },
  };
};

const buildFactureEvent = (f: Facture): CalendarEvent => {
  const ttc = Number(f.montant_ttc) || 0;
  const montant = ttc.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  return {
    id: `facture-${f.id}`,
    title: `Facture ${f.numero_facture} • ${montant} TND`,
    start: formatDateOnly(f.date_facture),
    allDay: true,
    extendedProps: {
      calendar: statutFactureToCalendarColor(f.statut),
      kind: "facture",
      facture: f,
    },
  };
};

const Calendar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(
    null
  );
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleUpper = (user?.role ?? "").trim().toUpperCase();
  const showFacturesOnCalendar =
    roleUpper === "FINANCE" || roleUpper === "ADMIN";

  const loadCommandes = canQueryCommandesList(user?.role ?? null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const next: CalendarEvent[] = [];

        if (loadCommandes && token) {
          const pages: Commande[] = [];
          let page = 1;
          let lastPage = 1;

          do {
            const res = await listCommandes(page, 100, {
              token: token ?? undefined,
            });
            const data = res.commandes.data ?? [];
            const paginator = res.commandes.paginatorInfo;

            pages.push(...data);
            lastPage = paginator?.lastPage ?? 1;
            page += 1;
          } while (page <= lastPage);

          const mine = filterCommandesForCalendarUser(
            pages,
            user?.id ?? null,
            user?.role ?? null
          );

          const mappedCommandes = mine
            .filter((commande) => !!commande.date_livraison_prevue)
            .map(buildCommandeEvent);

          next.push(...mappedCommandes);
        }

        if (showFacturesOnCalendar && token) {
          try {
            const factures = await fetchAllFactures(token);
            for (const f of factures) {
              if (!f?.date_facture) continue;
              next.push(buildFactureEvent(f));
            }
          } catch (fe) {
            console.error("Erreur chargement factures calendrier:", fe);
          }
        }

        setEvents(next);
      } catch (e) {
        console.error("Erreur chargement commandes calendrier:", e);
        setError("Impossible de charger le calendrier.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id, user?.role, token, showFacturesOnCalendar, loadCommandes]);

  const stats = useMemo(() => {
    let commandes = 0;
    let factures = 0;
    for (const e of events) {
      if (e.extendedProps?.kind === "facture") factures++;
      else commandes++;
    }
    return { total: events.length, commandes, factures };
  }, [events]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const kind = clickInfo.event.extendedProps?.kind as
      | "commande"
      | "facture"
      | undefined;
    if (kind === "facture") {
      setSelectedFacture(
        (clickInfo.event.extendedProps.facture as Facture) ?? null
      );
      setSelectedCommande(null);
    } else {
      setSelectedCommande(
        (clickInfo.event.extendedProps.commande as Commande) ?? null
      );
      setSelectedFacture(null);
    }
    openModal();
  };

  const handleCloseModal = () => {
    setSelectedCommande(null);
    setSelectedFacture(null);
    closeModal();
  };

  const headerSubtitle = useMemo(() => {
    if (isAdminUser(user?.role ?? null)) {
      return showFacturesOnCalendar
        ? "Commandes (date de livraison prévue) et factures (date d'émission), vue complète."
        : "Toutes les commandes (vue administrateur), par date de livraison prévue.";
    }
    if (roleUpper === "FINANCE") {
      return "Vos factures, positionnées à la date d'émission (vue finance).";
    }
    if (roleUpper === "LOGISTIQUE" || roleUpper === "CONTRAT") {
      return "Toutes les commandes de votre section (logistique / contrat).";
    }
    if (!loadCommandes && !showFacturesOnCalendar) {
      return "Ce calendrier affiche les commandes (logistique) ou les factures (finance) ; aucune donnée pour votre rôle.";
    }
    return "Uniquement les commandes créées sous votre compte.";
  }, [user?.role, roleUpper, showFacturesOnCalendar, loadCommandes]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Votre calendrier
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {headerSubtitle}
            </p>
          </div>

          <div className="text-right text-sm text-gray-500 dark:text-gray-400">
            <div>
              Total :{" "}
              <span className="font-medium text-gray-800 dark:text-white">
                {stats.total}
              </span>
            </div>
            {showFacturesOnCalendar ? (
              <div className="mt-0.5 text-xs">
                {loadCommandes ? (
                  <>
                    <span className="font-medium">{stats.commandes}</span> cmd. ·{" "}
                    <span className="font-medium">{stats.factures}</span> fact.
                  </>
                ) : (
                  <>
                    <span className="font-medium">{stats.factures}</span> facture
                    {stats.factures !== 1 ? "s" : ""}
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
          {loadCommandes ? (
            <>
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200">
                Cmd BROUILLON
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                Cmd VALIDEE
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                LIVREP
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                LIVREC
              </span>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
                Cmd ANNULEE
              </span>
            </>
          ) : null}
          {showFacturesOnCalendar ? (
            <>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-violet-800 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-200">
                Fact. brouillon
              </span>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-800 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
                Fact. validée
              </span>
              <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-teal-800 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-200">
                Fact. payée
              </span>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-800 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
                Fact. annulée
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="custom-calendar p-4">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Chargement…
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-600">{error}</div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={frLocale}
            firstDay={1}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Aujourd’hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
            }}
            events={events}
            selectable={false}
            editable={false}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
          />
        )}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col overflow-y-auto px-2 custom-scrollbar">
          {selectedFacture ? (
            <>
              <div>
                <h5 className="mb-2 text-theme-xl font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
                  Détail facture
                </h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Facture positionnée à la date d&apos;émission
                </p>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Info label="ID" value={selectedFacture.id} />
                <Info label="N° facture" value={selectedFacture.numero_facture} />
                <Info label="Date facture" value={selectedFacture.date_facture} />
                <Info label="Statut" value={selectedFacture.statut} />
                <Info label="Montant HT" value={selectedFacture.montant_ht} />
                <Info label="Montant TTC" value={selectedFacture.montant_ttc} />
                <Info
                  label="Pénalités"
                  value={selectedFacture.montant_penalites ?? "—"}
                />
                <Info
                  label="Jours retard"
                  value={selectedFacture.jours_retard_total ?? "—"}
                />
                <Info
                  label="Fournisseur"
                  value={selectedFacture.fournisseur?.raison_sociale ?? "—"}
                />
                <Info
                  label="Contrat"
                  value={selectedFacture.contrat?.numero_contrat ?? "—"}
                />
                <Info
                  label="BL liés"
                  value={selectedFacture.bon_livraisons?.length ?? 0}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <h5 className="mb-2 text-theme-xl font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
                  Détail commande
                </h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Consultation de la commande planifiée dans le calendrier
                </p>
              </div>

              {selectedCommande ? (
                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Info label="ID" value={selectedCommande.id} />
                  <Info label="N° commande" value={selectedCommande.numero_commande} />
                  <Info label="Date commande" value={selectedCommande.date_commande} />
                  <Info
                    label="Date livraison prévue"
                    value={selectedCommande.date_livraison_prevue}
                  />
                  <Info label="Statut" value={selectedCommande.statut} />
                  <Info label="Quantité" value={selectedCommande.quantite} />
                  <Info label="Emballage ID" value={selectedCommande.emballage_id} />
                  <Info label="Fournisseur ID" value={selectedCommande.fournisseur_id} />
                  <Info label="Contrat ID" value={selectedCommande.contrat_id} />
                  <Info label="Entrepôt ID" value={selectedCommande.entrepot_id} />
                  <Info label="Créé par" value={selectedCommande.created_by} />
                  <Info label="Créé le" value={selectedCommande.created_at ?? "-"} />
                </div>
              ) : (
                <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                  Aucun élément sélectionné.
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex items-center gap-3 sm:justify-end">
            <button
              onClick={handleCloseModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

function Info({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
        {value ?? "-"}
      </div>
    </div>
  );
}

const renderEventContent = (eventInfo: EventContentArg) => {
  const color = String(eventInfo.event.extendedProps.calendar || "Slate");

  const styles: Record<string, string> = {
    Slate:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200",
    Blue:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
    Amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
    Green:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
    Red:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
    Indigo:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200",
  };

  const dotStyles: Record<string, string> = {
    Slate: "bg-slate-500",
    Blue: "bg-blue-500",
    Amber: "bg-amber-500",
    Green: "bg-emerald-500",
    Red: "bg-rose-500",
    Indigo: "bg-indigo-500",
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-medium shadow-sm ${styles[color] || styles.Slate}`}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotStyles[color] || dotStyles.Slate}`}
      />
      <span className="truncate">{eventInfo.event.title}</span>
    </div>
  );
};

export default Calendar;
