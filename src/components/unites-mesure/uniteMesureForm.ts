export type UniteMesureFormState = {
  code: string;
  label: string;
  dimension: string;
  facteur_vers_kg: string;
  facteur_vers_l: string;
  sort_order: string;
};

export type UniteMesureFieldErrors = Partial<Record<keyof UniteMesureFormState, string>>;

export function emptyUniteMesureForm(dimension = "masse"): UniteMesureFormState {
  return {
    code: "",
    label: "",
    dimension,
    facteur_vers_kg: "",
    facteur_vers_l: "",
    sort_order: "0",
  };
}

export function parseOptionalPositiveFactor(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function validateUniteMesureForm(
  form: UniteMesureFormState,
  isEdit: boolean
): UniteMesureFieldErrors {
  const errors: UniteMesureFieldErrors = {};

  const code = form.code.trim();
  if (!isEdit) {
    if (!code) {
      errors.code = "Le code est obligatoire.";
    } else if (!/^[A-Za-z0-9_]+$/.test(code)) {
      errors.code = "Lettres, chiffres et underscore uniquement (ex. Kg, L, m3).";
    } else if (code.length > 20) {
      errors.code = "20 caractères maximum.";
    }
  }

  const label = form.label.trim();
  if (!label) {
    errors.label = "Le libellé est obligatoire.";
  } else if (label.length < 2) {
    errors.label = "Au moins 2 caractères.";
  } else if (label.length > 80) {
    errors.label = "80 caractères maximum.";
  }

  const sortRaw = form.sort_order.trim();
  if (sortRaw === "") {
    errors.sort_order = "Indiquez un ordre (0 = en tête de liste).";
  } else {
    const sortOrder = Number(sortRaw);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      errors.sort_order = "Entier positif ou zéro uniquement.";
    }
  }

  const fKg = parseOptionalPositiveFactor(form.facteur_vers_kg);
  const fL = parseOptionalPositiveFactor(form.facteur_vers_l);

  if (form.facteur_vers_kg.trim() !== "" && fKg === null) {
    errors.facteur_vers_kg = "Nombre strictement positif requis.";
  } else if (fKg !== null && fKg <= 0) {
    errors.facteur_vers_kg = "Le facteur doit être supérieur à 0.";
  }

  if (form.facteur_vers_l.trim() !== "" && fL === null) {
    errors.facteur_vers_l = "Nombre strictement positif requis.";
  } else if (fL !== null && fL <= 0) {
    errors.facteur_vers_l = "Le facteur doit être supérieur à 0.";
  }

  const dim = form.dimension.toLowerCase();
  if (dim === "masse") {
    if (fKg === null) {
      errors.facteur_vers_kg = "Obligatoire pour la masse (ex. 1 pour Kg → kg).";
    }
    if (fL !== null) {
      errors.facteur_vers_l = "Non applicable à la masse.";
    }
  } else if (dim === "volume") {
    if (fL === null) {
      errors.facteur_vers_l = "Obligatoire pour le volume (ex. 1 pour L).";
    }
    if (fKg !== null) {
      errors.facteur_vers_kg = "Non applicable au volume.";
    }
  } else if (fKg !== null || fL !== null) {
    errors.facteur_vers_kg = "Conversion réservée à la masse ou au volume.";
    errors.facteur_vers_l = "Conversion réservée à la masse ou au volume.";
  }

  return errors;
}

export function parseSortOrder(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  const n = parseInt(trimmed, 10);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}
