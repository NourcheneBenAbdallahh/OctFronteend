"use client";

import { OptionSearchablePicker } from "@/components/ui/OptionSearchablePicker";
import type { UserRole } from "@/lib/users.api";

type Props = {
  value: string;
  onChange: (role: string) => void;
  options: UserRole[];
  roleFr: (role: string) => string;
  placeholder?: string;
  disabled?: boolean;
  includeAllOption?: { label: string };
  dropdownZClassName?: string;
};

export function RoleSearchableDropdown({
  value,
  onChange,
  options,
  roleFr,
  placeholder = "Choisir un rôle…",
  disabled,
  includeAllOption,
  dropdownZClassName = "z-[1200]",
}: Props) {
  const pickerOptions = [
    ...(includeAllOption ? [{ id: "", label: includeAllOption.label }] : []),
    ...options.map((r) => ({ id: r, label: roleFr(r) })),
  ];

  return (
    <OptionSearchablePicker
      value={value}
      onChange={onChange}
      options={pickerOptions}
      placeholder={placeholder}
      disabled={disabled}
      searchPlaceholder="Rechercher rôle…"
      noResultsText="Aucun rôle"
      dropdownZClassName={dropdownZClassName}
      selectedOptionClassName="bg-indigo-600/10 text-indigo-800"
    />
  );
}
