"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/[locale]/track/actions";
import type { Locale } from "@/lib/i18n";

type Strings = {
  codeLabel: string;
  codePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  submit: string;
  submitting: string;
  error: string;
  rateLimited: string;
  unavailable: string;
};

const initial: LoginState = { error: null };

export function LoginForm({ locale, t }: { locale: Locale; t: Strings }) {
  const [state, formAction, pending] = useActionState(login, initial);

  // Controlled on purpose: React resets an uncontrolled form after a form
  // action runs, which would wipe both fields on a failed login and force the
  // client to retype the project code because they mistyped their phone.
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");

  const message =
    state.error === "rateLimited"
      ? t.rateLimited
      : state.error === "unavailable"
        ? t.unavailable
        : state.error
          ? t.error
          : null;

  return (
    <form action={formAction} className="mt-8 space-y-5 text-start">
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label htmlFor="code" className="block text-xs text-white/50">
          {t.codeLabel}
        </label>
        <input
          id="code"
          name="code"
          required
          autoComplete="off"
          spellCheck={false}
          dir="ltr"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t.codePlaceholder}
          className="mt-2 w-full rounded-sharp border border-white/20 bg-transparent px-4 py-3 text-white placeholder:text-white/25 focus:border-gold focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-xs text-white/50">
          {t.phoneLabel}
        </label>
        <input
          id="phone"
          name="phone"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder={t.phonePlaceholder}
          className="mt-2 w-full rounded-sharp border border-white/20 bg-transparent px-4 py-3 text-white placeholder:text-white/25 focus:border-gold focus:outline-none"
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
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
