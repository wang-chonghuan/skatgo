import { m } from '~/paraglide/messages'

// The sites SkatGo recommends on About SkatGo (SKATGO-198, the human: 「我推荐别人，这样显得我是社区的一员」; on one
// page, not in every page's footer). Each picture is that site's own, cut square from its own files and kept in
// `app/public/friends/`.

export type Friend = { name: string; href: (locale: string) => string; logo: string; note: () => string }

export const FRIENDS: readonly Friend[] = [
  { name: '32karten', href: () => 'https://32karten.de/', logo: '/friends/32karten.webp', note: m.about_sites_32karten },
  {
    name: 'pagat.com',
    href: (locale) => (locale === 'de' ? 'https://www.pagat.com/de/' : 'https://www.pagat.com/'),
    logo: '/friends/pagat.webp',
    note: m.about_sites_pagat,
  },
  { name: 'DSkV', href: () => 'https://www.dskv.de/', logo: '/friends/dskv.webp', note: m.about_sites_dskv },
  { name: 'The Checker Maven', href: () => 'https://checkermaven.com/', logo: '/friends/checkermaven.webp', note: m.about_sites_checkermaven },
]
