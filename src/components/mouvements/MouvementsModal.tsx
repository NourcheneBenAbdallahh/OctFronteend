"use client";
import React from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { EmballageRef  as Emballage } from "@/types/emballage";
import { Lot } from "@/types/lot";
import { Entrepot } from "@/types/entrepot";
import { MouvementType } from "@/types/mouvement";
import { needsLot, needsSource, needsDestination, formatEmballageLabel, TYPES } from "./utils";

interface Props {
  isOpen: boolean;
  saving: boolean;
  form: {
    type: MouvementType;
    emballageId: string;
    lotId: string;
    sourceId: string;
    destId: string;
    quantite: number;
  };
  setForm: React.Dispatch<React.SetStateAction<Props["form"]>>;
  lots: Lot[];
  emballages: Emballage[];
  entrepots: Entrepot[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function MouvementsModal({ isOpen, saving, form, setForm, lots, emballages, entrepots, onClose, onSubmit }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={() => !saving && onClose()} className="max-w-xl p-8 rounded-3xl">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Nouveau Flux</h2>
          <p className="text-sm text-gray-400">Saisie d'un mouvement de stock en mode brouillon.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Type de mouvement</Label>
            <select 
              value={form.type} 
              onChange={(e) => setForm(f => ({ ...f, type: e.target.value as MouvementType }))}
              className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-[#00A09D] outline-none text-sm font-bold"
            >
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Quantité (kg/unités)</Label>
            <input
              type="number"
              step="0.01"
              value={form.quantite}
              onChange={(e) => setForm(f => ({ ...f, quantite: parseFloat(e.target.value) || 0 }))}
              className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-[#00A09D] outline-none text-sm font-bold"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Produit (Emballage)</Label>
          <select 
            value={form.emballageId} 
            onChange={(e) => setForm(f => ({ ...f, emballageId: e.target.value }))}
            className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-[#00A09D] outline-none text-sm font-bold"
          >
            <option value="">Sélectionner le produit...</option>
            {emballages.map(emb => <option key={emb.id} value={emb.id}>{formatEmballageLabel(emb)}</option>)}
          </select>
        </div>

        {needsLot(form.type) && (
          <div className="space-y-2">
            <Label>Lot Source</Label>
            <select 
              value={form.lotId} 
              onChange={(e) => setForm(f => ({ ...f, lotId: e.target.value }))}
              className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-[#00A09D] outline-none text-sm font-bold"
            >
              <option value="">Sélectionner le lot...</option>
              {lots.map(l => <option key={l.id} value={l.id}>{l.code_lot}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Source</Label>
            <select 
              disabled={!needsSource(form.type)}
              value={form.sourceId} 
              onChange={(e) => setForm(f => ({ ...f, sourceId: e.target.value }))}
              className="w-full p-3 rounded-xl border-2 border-gray-100 disabled:bg-gray-50 focus:border-[#00A09D] outline-none text-sm font-bold"
            >
              <option value="">Provenance...</option>
              {entrepots.map(e => <option key={e.id} value={e.id}>{e.adresse}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Destination</Label>
            <select 
              disabled={!needsDestination(form.type)}
              value={form.destId} 
              onChange={(e) => setForm(f => ({ ...f, destId: e.target.value }))}
              className="w-full p-3 rounded-xl border-2 border-gray-100 disabled:bg-gray-50 focus:border-[#00A09D] outline-none text-sm font-bold"
            >
              <option value="">Destination...</option>
              {entrepots.map(e => <option key={e.id} value={e.id}>{e.adresse}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 py-4">Annuler</Button>
          <Button variant="primary"  disabled={saving} className="flex-1 py-4">
            {saving ? "Traitement..." : "Confirmer le flux"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{children}</label>;
}