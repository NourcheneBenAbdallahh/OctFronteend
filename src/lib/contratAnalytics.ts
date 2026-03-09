export function getContratStatus(contrat: any) {
  const progress =
    (contrat.quantite_realisee / contrat.quantite_contractuelle) * 100;

  if (contrat.quantite_realisee > contrat.quantite_contractuelle) {
    return {
      label: "Dépassement",
      color: "text-red-600",
    };
  }

  if (progress > 80) {
    return {
      label: "Presque atteint",
      color: "text-orange-500",
    };
  }

  return {
    label: "Normal",
    color: "text-green-600",
  };
}