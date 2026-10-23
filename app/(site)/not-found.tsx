import Link from "next/link";

export default function SiteNotFound() {
  return (
    <div className="s-card mx-auto flex max-w-xl flex-col items-center p-10 text-center">
      <div className="text-6xl font-black text-accent">404</div>
      <h1 className="mt-3 text-xl font-bold text-fg">This page went wide of the post</h1>
      <p className="mt-2 text-sm text-subtle">The match or page you&apos;re looking for doesn&apos;t exist or isn&apos;t published.</p>
      <Link href="/" className="s-btn s-btn-primary mt-6">Back to predictions</Link>
    </div>
  );
}
