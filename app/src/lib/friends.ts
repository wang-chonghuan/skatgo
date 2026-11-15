// The sites SkatGo recommends in the footer (SKATGO-198, the human: 「我推荐别人，这样显得我是社区的一员」). Each picture
// is that site's own, cut square from its own files and kept in `app/public/friends/`.

export type Friend = { name: string; href: (locale: string) => string; logo: string }

export const FRIENDS: readonly Friend[] = [
  { name: '32karten', href: () => 'https://32karten.de/', logo: '/friends/32karten.webp' },
  { name: 'pagat.com', href: (locale) => (locale === 'de' ? 'https://www.pagat.com/de/' : 'https://www.pagat.com/'), logo: '/friends/pagat.webp' },
  { name: 'DSkV', href: () => 'https://www.dskv.de/', logo: '/friends/dskv.webp' },
  { name: 'The Checker Maven', href: () => 'https://checkermaven.com/', logo: '/friends/checkermaven.webp' },
]
