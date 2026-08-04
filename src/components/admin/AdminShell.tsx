import Link from "next/link";
import { adminLogout } from "@/app/admin/actions";

const LINKS = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/projects", label: "المشاريع" },
  { href: "/admin/clients", label: "العملاء" },
  { href: "/admin/content/services", label: "الخدمات" },
  { href: "/admin/content/faqs", label: "الأسئلة" },
  { href: "/admin/content/testimonials", label: "آراء العملاء" },
  { href: "/admin/content/stats", label: "الأرقام" },
  { href: "/admin/content/engineer", label: "بيانات المهندس" },
  { href: "/admin/leads", label: "الاستفسارات" },
];

/** Chrome for every authenticated admin page. The login page does not use it. */
export function AdminShell({
  children,
  title,
  action,
}: {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/admin" className="brand text-base">
            Future Interiors
          </Link>
          <form action={adminLogout}>
            <button
              type="submit"
              className="rounded-pill border border-white/25 px-4 py-2 text-xs text-white/70 transition-colors hover:border-gold hover:text-gold"
            >
              خروج
            </button>
          </form>
        </div>

        <nav className="border-t border-white/10">
          <div className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap px-4 py-3 text-xs text-white/60 transition-colors hover:text-gold"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-2xl">{title}</h1>
          {action}
        </div>
        {children}
      </main>
    </div>
  );
}
