import { graphqlRequest, type GraphqlRequestOptions } from "./graphqlClient";
import {
  CreateFactureInput,
  Facture,
  FacturesPaginatorInfo,
  TableFacture,
  UpdateFactureInput,
} from "@/types/facture";

export function normalizeFacture(f: any): TableFacture {
  return {
    ...f,
    id: f.id,
    bon_livraisons: Array.isArray(f.bon_livraisons) ? f.bon_livraisons : [],
    montant_ht: Number(f.montant_ht || 0),
    montant_penalites: Number(f.montant_penalites || 0),
    montant_ht_net: Number(f.montant_ht_net || 0),
    montant_ttc: Number(f.montant_ttc || 0),
    jours_retard_total: Number(f.jours_retard_total || 0),
    statut:
      f.statut === "VALIDE" || f.statut === "PAYE" || f.statut === "ANNULE"
        ? f.statut
        : "BROUILLON",
  };
}

export type ListFacturesResponse = {
  factures: {
    data: Facture[];
    paginatorInfo: FacturesPaginatorInfo;
  };
};

const FACTURE_FIELDS = `
  id
  numero_facture
  date_facture
  montant_ht
  montant_penalites
  montant_ht_net
  montant_ttc
  jours_retard_total
  statut
  valide_par {
    id
    name
  }
  created_by {
    id
    name
  }
  fournisseur {
    id
    raison_sociale
  }
  contrat {
    id
    numero_contrat
  }

  bon_livraisons {
    id
    numero_bl
    date_reception
    quantite_recue
    is_factured
  }
`;

const LIST_FACTURES = `
  query ListFactures($page: Int!) {
    factures(page: $page) {
      data {
        ${FACTURE_FIELDS}
      }
      paginatorInfo {
        currentPage
        lastPage
        total
      }
    }
  }
`;

export async function listFactures(page = 1, opts?: GraphqlRequestOptions) {
  return graphqlRequest<ListFacturesResponse>(LIST_FACTURES, { page }, opts);
}

/** Charge toutes les pages de factures (recherche, stats). */
export async function listAllFactures(
  opts?: GraphqlRequestOptions
): Promise<Facture[]> {
  const acc: Facture[] = [];
  let page = 1;
  for (;;) {
    const { factures } = await listFactures(page, opts);
    acc.push(...factures.data);
    if (page >= factures.paginatorInfo.lastPage) break;
    page += 1;
    if (page > 200) break;
  }
  return acc;
}

const CREATE_FACTURE = `
  mutation CreateFacture($input: CreateFactureInput!) {
    createFacture(input: $input) {
      ${FACTURE_FIELDS}
    }
  }
`;

export async function createFacture(input: CreateFactureInput) {
  return graphqlRequest<{ createFacture: Facture }>(CREATE_FACTURE, { input });
}

const UPDATE_FACTURE = `
  mutation UpdateFacture($id: ID!, $input: UpdateFactureInput!) {
    updateFacture(id: $id, input: $input) {
      ${FACTURE_FIELDS}
    }
  }
`;

function sanitizeFactureInput(input: Partial<UpdateFactureInput>) {
  const allowedFields = [
    "numero_facture",
    "date_facture",
    "montant_ht",
    "bon_livraison_ids",
    "statut",
  ];

  const sanitized: Record<string, unknown> = {};

  allowedFields.forEach((field) => {
    if (input[field as keyof UpdateFactureInput] !== undefined) {
      sanitized[field] = input[field as keyof UpdateFactureInput];
    }
  });

  return sanitized;
}

export async function updateFacture(
  id: string | number,
  input: UpdateFactureInput
) {
  const sanitizedInput = sanitizeFactureInput(input);

  return graphqlRequest<{ updateFacture: Facture }>(UPDATE_FACTURE, {
    id,
    input: sanitizedInput,
  });
}

const DELETE_FACTURE = `
  mutation DeleteFacture($id: ID!) {
    deleteFacture(id: $id)
  }
`;

export async function deleteFacture(id: string | number) {
  return graphqlRequest<{ deleteFacture: boolean }>(DELETE_FACTURE, { id });
}