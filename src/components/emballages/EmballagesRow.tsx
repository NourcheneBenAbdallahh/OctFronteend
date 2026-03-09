import React from "react";
import {TableEmballages 
  } from "@/types/emballage";
interface Props {
  row: TableEmballages;
  onEdit: (item: TableEmballages) => void;
  setRows: React.Dispatch<React.SetStateAction<TableEmballages[]>>; // <-- Ajouté
}

export default function EmballagesRow({ row, onEdit, setRows }: Props) {
  function handleDelete() {
    if (!confirm("Voulez-vous vraiment supprimer cet emballage ?")) return;

    // Exemple : suppression côté client
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    // Ici tu peux aussi appeler deleteEmballages(row.id) pour la suppression serveur
  }

  return (
    <tr>
      <td>{row.code}</td>
      <td>{row.name}</td>
      <td>{row.type}</td>
      <td>
        {row.capacity_value} {row.capacity_unit}
      </td>
      <td>{row.status}</td>
      <td>
        <button onClick={() => onEdit(row)} className="text-blue-500 mr-2">
          Edit
        </button>
        <button onClick={handleDelete} className="text-red-500">
          Delete
        </button>
      </td>
    </tr>
  );
}