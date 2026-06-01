export type CountryOption = {
  code: string;
  label: string;
};

/** Liste légère pour le profil — Tunisie en tête, puis ordre alphabétique. */
export const PROFILE_COUNTRIES: CountryOption[] = [
  { code: "TN", label: "Tunisie" },
  { code: "DZ", label: "Algérie" },
  { code: "MA", label: "Maroc" },
  { code: "LY", label: "Libye" },
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgique" },
  { code: "CA", label: "Canada" },
  { code: "CH", label: "Suisse" },
  { code: "DE", label: "Allemagne" },
  { code: "ES", label: "Espagne" },
  { code: "GB", label: "Royaume-Uni" },
  { code: "IT", label: "Italie" },
  { code: "LU", label: "Luxembourg" },
  { code: "NL", label: "Pays-Bas" },
  { code: "PT", label: "Portugal" },
  { code: "US", label: "États-Unis" },
  { code: "AE", label: "Émirats arabes unis" },
  { code: "SA", label: "Arabie saoudite" },
  { code: "QA", label: "Qatar" },
  { code: "EG", label: "Égypte" },
  { code: "SN", label: "Sénégal" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "CM", label: "Cameroun" },
  { code: "TR", label: "Turquie" },
  { code: "CN", label: "Chine" },
  { code: "IN", label: "Inde" },
  { code: "JP", label: "Japon" },
  { code: "BR", label: "Brésil" },
  { code: "AU", label: "Australie" },
];

export const DEFAULT_COUNTRY_CODE = "TN";

export function countryLabel(code?: string | null): string {
  if (!code) return "Non renseigné";
  return PROFILE_COUNTRIES.find((c) => c.code === code)?.label ?? code;
}
