import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminEmail()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm border border-gold/30 p-10">
        <p className="brand text-center text-lg text-white">Future Interiors</p>
        <h1 className="mt-3 text-center text-sm tracking-widest text-gold">لوحة التحكم</h1>
        <AdminLoginForm />
      </div>
    </div>
  );
}
