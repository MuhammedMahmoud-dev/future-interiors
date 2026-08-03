"use client";

import { useActionState, useState } from "react";
import { adminLogin, type AdminLoginState } from "@/app/admin/actions";

const initial: AdminLoginState = { error: null };

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, initial);

  // Controlled, so a failed attempt does not wipe the email as well.
  const [email, setEmail] = useState("");

  const message =
    state.error === "rateLimited"
      ? "حاولت كتير. استنى ربع ساعة وجرب تاني."
      : state.error
        ? "الإيميل أو الباسورد مش صحيح."
        : null;

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="block text-xs text-white/50">
          الإيميل
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          dir="ltr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-sharp border border-white/20 bg-transparent px-4 py-3 text-white focus:border-gold focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs text-white/50">
          الباسورد
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          dir="ltr"
          className="mt-2 w-full rounded-sharp border border-white/20 bg-transparent px-4 py-3 text-white focus:border-gold focus:outline-none"
        />
      </div>

      {message && (
        <p role="alert" className="border-s-2 border-red-500 ps-3 text-sm text-red-400">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sharp bg-gold px-6 py-4 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "بيتحقق…" : "دخول"}
      </button>
    </form>
  );
}
