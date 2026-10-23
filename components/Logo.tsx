import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-emerald-700 text-lg font-black text-ink shadow-lg shadow-brand/20">i</span>
      <span className="text-lg font-extrabold tracking-tight text-white">
        Predict<span className="text-brand">Football</span>Tips
      </span>
    </Link>
  );
}
