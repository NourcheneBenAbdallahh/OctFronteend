"use client";

import { OptionSearchablePicker } from "@/components/ui/OptionSearchablePicker";
import { PROFILE_COUNTRIES } from "@/lib/countries";

type Props = {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
};

/** Sélecteur pays profil : scroll OCT, ancré viewport, au-dessus des modales. */
export function CountrySearchablePicker({ value, onChange, disabled }: Props) {
  return (
    <OptionSearchablePicker
      value={value}
      onChange={onChange}
      options={PROFILE_COUNTRIES.map((c) => ({ id: c.code, label: c.label }))}
      placeholder="Choisir un pays…"
      disabled={disabled}
      searchPlaceholder="Rechercher un pays…"
      noResultsText="Aucun pays trouvé"
      accentVariant="teal"
      dropdownZClassName="z-[100002]"
      listMaxHeightClassName="max-h-[min(10rem,28vh)]"
    />
  );
}
