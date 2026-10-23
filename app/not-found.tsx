import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl font-black text-brand">404</div>
      <p className="mt-2 text-muted">This page went wide of the post.</p>
      <Link href="/" className="btn btn-primary mt-6">Back to predictions</Link>
    </div>
  );
}
