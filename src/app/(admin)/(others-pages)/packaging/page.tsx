import { listPackagings } from "@/lib/packaging.api";

export default async function Page() {
  const result = await listPackagings(1, 10);

  return (
    <div style={{ padding: 16 }}>
      <h1>Packagings</h1>
      <pre>{JSON.stringify(result.packagings.data, null, 2)}</pre>
    </div>
  );
}