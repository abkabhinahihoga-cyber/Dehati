import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'hi'],
  defaultLocale: 'en',
  localePrefix: 'as-needed' // Only adds /hi for hindi, /en is default
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
