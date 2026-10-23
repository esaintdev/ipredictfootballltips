export function Flash({ msg, error }: { msg?: string; error?: string }) {
  if (!msg && !error) return null;
  return (
    <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${error ? "border-loss/50 bg-loss/10 text-loss" : "border-brand/50 bg-brand/10 text-brand"}`}>
      {error ?? msg}
    </div>
  );
}
