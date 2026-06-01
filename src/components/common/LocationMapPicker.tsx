"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin, Search } from "lucide-react";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER: [number, number] = [36.8065, 10.1815];

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export type LocationMapValue = {
  latitude: number | null;
  longitude: number | null;
  adresse: string;
};

type Props = {
  value: LocationMapValue;
  onChange: (value: LocationMapValue) => void;
  adresseError?: string;
  onClearAdresseError?: () => void;
};

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number, adresse?: string) => void;
}) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        onPick(lat, lng, data.display_name as string | undefined);
      } catch {
        onPick(lat, lng);
      }
    },
  });
  return null;
}

async function searchAddress(query: string): Promise<NominatimResult | null> {
  const q = query.trim();
  if (q.length < 3) return null;

  const params = new URLSearchParams({
    format: "json",
    q,
    limit: "1",
    countrycodes: "tn,ma,dz",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    { headers: { Accept: "application/json" } }
  );
  if (!response.ok) return null;

  const results = (await response.json()) as NominatimResult[];
  return results[0] ?? null;
}

export default function LocationMapPicker({
  value,
  onChange,
  adresseError,
  onClearAdresseError,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const hasMarker =
    value.latitude !== null &&
    value.longitude !== null &&
    !Number.isNaN(value.latitude) &&
    !Number.isNaN(value.longitude);

  const mapCenter: [number, number] = hasMarker
    ? [value.latitude as number, value.longitude as number]
    : DEFAULT_CENTER;

  const applyCoords = useCallback(
    (lat: number, lng: number, adresse?: string) => {
      onChange({
        latitude: lat,
        longitude: lng,
        adresse: adresse?.trim() ? adresse : value.adresse,
      });
      onClearAdresseError?.();
      setSearchError("");
    },
    [onChange, onClearAdresseError, value.adresse]
  );

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim() || value.adresse.trim();
    if (q.length < 3) {
      setSearchError("Saisissez au moins 3 caractères.");
      return;
    }

    setSearching(true);
    setSearchError("");
    try {
      const hit = await searchAddress(q);
      if (!hit) {
        setSearchError("Adresse introuvable. Essayez une formulation plus précise.");
        return;
      }
      const lat = Number(hit.lat);
      const lng = Number(hit.lon);
      onChange({
        latitude: lat,
        longitude: lng,
        adresse: hit.display_name,
      });
      onClearAdresseError?.();
      setSearchQuery(hit.display_name);
    } catch {
      setSearchError("Recherche indisponible. Réessayez dans un instant.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#00A09D]/50"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une adresse (ex. Zone industrielle, Tunis)…"
          className="w-full rounded-2xl border-2 border-gray-100 bg-white py-3.5 pl-11 pr-28 text-sm font-bold text-gray-800 outline-none transition-all focus:border-[#00A09D] focus:ring-4 focus:ring-[#00A09D]/10"
        />
        <button
          type="submit"
          disabled={searching}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[#00A09D] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white transition-all hover:bg-[#008f8c] disabled:opacity-50"
        >
          {searching ? <Loader2 size={14} className="animate-spin" /> : "Localiser"}
        </button>
      </form>
      {searchError && (
        <p className="text-xs font-bold text-amber-600">{searchError}</p>
      )}

      <div className="h-[220px] w-full overflow-hidden rounded-[1.5rem] border-2 border-gray-100 relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={hasMarker ? 14 : 11}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onPick={applyCoords} />
          {hasMarker && (
            <>
              <MapRecenter lat={value.latitude as number} lng={value.longitude as number} />
              <Marker
                position={[value.latitude as number, value.longitude as number]}
                icon={DefaultIcon}
              />
            </>
          )}
        </MapContainer>
        {!hasMarker && (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-3">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-gray-500 shadow-sm">
              Cliquez sur la carte ou recherchez une adresse
            </span>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-[1.5rem] border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white p-1 focus-within:border-[#00A09D]">
        <textarea
          rows={2}
          value={value.adresse}
          onChange={(e) => {
            onChange({ ...value, adresse: e.target.value });
            onClearAdresseError?.();
          }}
          placeholder="L'adresse s'affiche après recherche ou clic sur la carte…"
          className={`relative w-full resize-none bg-transparent px-5 py-4 text-sm font-bold text-gray-800 outline-none ${
            adresseError ? "text-red-700" : ""
          }`}
        />
        <MapPin className="absolute bottom-4 right-4 text-[#00A09D]/30" size={28} />
      </div>

      {hasMarker && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          GPS : {(value.latitude as number).toFixed(5)}, {(value.longitude as number).toFixed(5)}
        </p>
      )}
    </div>
  );
}
