import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-[100px] text-center">
      <p className="brand text-6xl text-accent-ink">404</p>
      <h1 className="mt-6 text-2xl">الصفحة مش موجودة</h1>
      <p className="mt-2 text-sm text-muted-ink">Page not found</p>
      <Link
        href="/ar"
        className="mt-10 rounded-card bg-ink px-8 py-4 text-sm text-white transition-opacity hover:opacity-90"
      >
        الرجوع للرئيسية
      </Link>
    </section>
  );
}
