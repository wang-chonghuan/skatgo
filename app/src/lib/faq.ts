import { m } from '~/paraglide/messages'

// The front page's questions (SKATGO-29), shared by the page and its FAQPage structured data so the two
// can never say different things. Answers describe what the code does (grill Q3).
export const faq = (): { q: string; a: string }[] => [
  { q: m.faq_free_q(), a: m.faq_free_a() },
  { q: m.faq_account_q(), a: m.faq_account_a() },
  { q: m.faq_score_q(), a: m.faq_score_a() },
  { q: m.faq_rules_q(), a: m.faq_rules_a() },
  { q: m.faq_phone_q(), a: m.faq_phone_a() },
]
