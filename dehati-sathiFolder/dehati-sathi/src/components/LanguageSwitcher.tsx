"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const otherLocale = locale === "en" ? "hi" : "en";
  const label = locale === "en" ? "हिं" : "EN";

  function handleSwitch() {
    startTransition(() => {
      router.replace(pathname, { locale: otherLocale });
    });
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={isPending}
      aria-label={`Switch to ${otherLocale === "hi" ? "Hindi" : "English"}`}
      className={`
        inline-flex items-center gap-1.5 
        px-3 py-1.5 
        rounded-full 
        text-sm font-medium 
        bg-white/80 backdrop-blur-sm 
        border border-green-200 
        text-green-700 
        hover:bg-green-50 hover:border-green-300 
        active:scale-95 
        transition-all duration-200 
        shadow-sm hover:shadow 
        cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <Globe className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
