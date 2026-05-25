import { pathToTourSlug } from "@/lib/appTour";

/** Attributs data-tour pour marquer tableau, recherche et actions d’un module. */
export function tourPageAttrs(modulePath: string) {
  const slug = pathToTourSlug(modulePath);
  return {
    table: { "data-tour": `page-${slug}-table` } as const,
    search: { "data-tour": `page-${slug}-search` } as const,
    actions: { "data-tour": `page-${slug}-actions` } as const,
  };
}
