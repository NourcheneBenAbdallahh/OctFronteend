"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type FournisseurMapItem = {
  id: string;
  raison_sociale: string;
  logo?: string | null;
  adresse?: string | null;
  statut?: "ACTIF" | "INACTIF" | null;
  latitude?: number | null;
  longitude?: number | null;
  adresse_geocodee?: string | null;
};

const defaultCenter: [number, number] = [36.8065, 10.1815];

function buildSupplierIcon(
  logo?: string | null,
  raisonSociale?: string,
  statut?: "ACTIF" | "INACTIF" | null
) {
  const letter = raisonSociale?.charAt(0)?.toUpperCase() || "F";
  const ringColor = statut === "INACTIF" ? "#e11d48" : "#00A09D";

  const inner = logo
    ? `<img src="${logo}" alt="${raisonSociale ?? "Fournisseur"}" style="width:34px;height:34px;border-radius:9999px;object-fit:cover;display:block;background:#fff;" />`
    : `<div style="width:34px;height:34px;border-radius:9999px;background:${ringColor};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;">${letter}</div>`;

  return L.divIcon({
    className: "supplier-marker-wrapper",
    html: `
      <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">
        <div style="
          width:38px;
          height:38px;
          border-radius:9999px;
          border:2px solid #ffffff;
          box-shadow:0 8px 20px rgba(0,0,0,0.18);
          overflow:hidden;
          background:#fff;
        ">
          ${inner}
        </div>
        <div style="
          position:absolute;
          bottom:-4px;
          width:10px;
          height:10px;
          background:${ringColor};
          border:2px solid #fff;
          border-radius:9999px;
          right:2px;
        "></div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 38],
    popupAnchor: [0, -36],
  });
}

export default function FournisseursRealMap({
  items,
}: {
  items: FournisseurMapItem[];
}) {
  const validItems = items.filter(
    (item) =>
      typeof item.latitude === "number" &&
      typeof item.longitude === "number"
  );

  const center =
    validItems.length > 0
      ? [validItems[0].latitude as number, validItems[0].longitude as number] as [number, number]
      : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={10}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
      className="rounded-2xl"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {validItems.map((item) => (
        <Marker
          key={item.id}
          position={[item.latitude as number, item.longitude as number]}
          icon={buildSupplierIcon(item.logo, item.raison_sociale, item.statut)}
        >
          <Popup>
            <div className="min-w-[180px] space-y-2">
              <div className="font-semibold text-gray-900">
                {item.raison_sociale}
              </div>

              <div className="text-xs text-gray-600">
                {item.adresse_geocodee || item.adresse || "Adresse indisponible"}
              </div>

              <div className="text-xs text-gray-600">
                Lat: {item.latitude} <br />
                Lng: {item.longitude}
              </div>

              <div>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                    item.statut === "INACTIF"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {item.statut || "ACTIF"}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}