import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'hi'],
  defaultLocale: 'hi',
  localePrefix: 'as-needed' // Hindi is primary. English gets /en when selected.
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
