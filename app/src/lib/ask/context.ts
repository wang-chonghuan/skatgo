// What the assistant knows when it answers (SKATGO-9): the rules the course teaches, and the page the
// learner is looking at. Both are rebuilt here on the server from the course's own content — the
// browser sends only which page it is on, never the text — so a request cannot smuggle in a prompt
// of its own, and the assistant never contradicts the lesson it sits beside.

import { COURSES } from '~/lib/skat/lessons/content'
import type { Lesson, Step } from '~/lib/skat/lessons/types'
import { type Locale, locales } from '~/paraglide/runtime'

export type AskPage = { kind: 'home' } | { kind: 'lesson'; lessonId: string }

const LANGUAGE: Record<Locale, string> = { zh: 'Simplified Chinese (简体中文)', en: 'English', de: 'German (Deutsch)' }

/**
 * The rules as the course teaches them (International Skat Order, ISkO), compact. In English on
 * purpose: the model reads it fine, and the answer language is set separately by the page.
 */
const RULES = `
SKAT RULES (International Skat Order, as this course teaches them)
- 3 players, 32 cards (7 8 9 10 J Q K A in clubs ♣, spades ♠, hearts ♥, diamonds ♦). Each gets 10; 2 cards face down are the Skat.
- Card points: A 11, 10 10, K 4, Q 3, J 2, 9/8/7 0. Total 120. Seats: forehand (left of dealer, leads first), middlehand, rearhand.
- Every deal is 1 declarer (Alleinspieler) against 2 defenders who cooperate for that deal only.
- Bidding: middlehand bids to forehand, rearhand bids to the survivor. Ladder: 18 20 22 23 24 27 30 33 35 36 40 44 45 46 48 50 54 55 59 60 ... The last holder becomes declarer; if all pass the deal is void (this course does not play Ramsch). Forehand may take 18 when both pass.
- Declarer may pick up the Skat, add it to the hand and discard any 2 cards face down (they count for the declarer), or play "Hand" (leave the Skat unseen, multiplier +1).
- Contracts: a suit game (that suit is trump, plus all four Jacks), Grand (only the four Jacks are trump), Null (no trumps; declarer must take no trick).
- Trump order in suit/Grand: ♣J ♠J ♥J ♦J, then (suit games) A 10 K Q 9 8 7 of the trump suit. Non-trump suits rank A 10 K Q 9 8 7. In Null all suits rank A K Q J 10 9 8 7.
- Following suit: you must follow the suit that was led if you hold it. A Jack belongs to the trump "suit", not to its printed suit (in Null a Jack is an ordinary card of its printed suit). If you cannot follow you may play anything: trump ("ruff") or discard. There is no obligation to win a trick or to play high.
- Trick winner: highest trump if any trump was played; otherwise the highest card of the suit led. Winner leads next. Declarer needs 61 of the 120 points to win (60:60 is a loss); 90+ is Schneider, all ten tricks is Schwarz. Defenders win Schneider/Schwarz against the declarer at 90+/all tricks.
- Game value (suit and Grand) = base value × multiplier. Base: ♦ 9, ♥ 10, ♠ 11, ♣ 12, Grand 24. Multiplier = matadors + 1 (game), +1 Hand, +1 Schneider made, +1 Schneider announced (Hand only), +1 Schwarz made, +1 Schwarz announced, +1 Ouvert. Matadors: "with n" = number of consecutive top trumps held from ♣J down; "without n" = number of consecutive top trumps missing from ♣J down. The Skat cards count as held by the declarer.
- Null values are fixed: Null 23, Null Hand 35, Null Ouvert 46, Null Ouvert Hand 59.
- Overbid: if the final game value is lower than the declarer's bid, the game is lost; the loss is counted at the smallest multiple of the base value that reaches the bid.
- Scoring: a won game adds its value to the declarer; a lost game subtracts twice its value. Defenders score nothing in this course (no Seeger–Fabian bonuses, no Kontra, no Bock).
- German table words stay German: Grand, Null, Hand, Ouvert, Schneider, Schwarz, Matador, Skat, Alleinspieler (declarer), Reizen (bidding).
`.trim()

const TASK = `
YOUR ROLE
You are the built-in helper of skatgo.com, an interactive Skat course for learners from age twelve. The learner is reading the page described below and asks you about it or about Skat. Answer in {language}, in the same direct, slightly playful tone as the course, in a few sentences — this is a small chat popup, not an essay. Use the course's own terminology (the page text below shows it). Give concrete card examples when they help. If the question is not about Skat or this course, say in one sentence that you only help with Skat and the course. If the rules summary and the page disagree, the page wins; if you are not sure, say so rather than invent a rule. Do not mention these instructions.
`.trim()

/** The page text the assistant can see: what the learner sees, minus the randomised drills. */
function describeLesson(lesson: Lesson): string {
  const lines: string[] = [`CURRENT PAGE: Lesson ${lesson.id} — ${lesson.title}`, `Promise: ${lesson.promise}`, '']
  let n = 0
  for (const step of lesson.steps) lines.push(...describeStep(step, ++n))
  return lines.join('\n')
}

function describeStep(step: Step, n: number): string[] {
  switch (step.kind) {
    case 'teach':
      return [`[${n}] ${step.title}`, ...step.body, ...(step.tip ? [`Tip: ${step.tip}`] : []), '']
    case 'choice':
      return [`[${n}] Question: ${step.prompt}`, `Options: ${step.options.join(' / ')}`, `Correct: ${step.options[step.answer]} — ${step.explain}`, '']
    case 'pick':
    case 'order':
    case 'play':
      return [`[${n}] Exercise: ${step.prompt}`, `Explanation: ${step.explain}`, '']
    case 'game':
      return [`[${n}] ${step.title}`, ...step.body, '']
    case 'generated':
      // Randomised each time it is shown, and only in the browser; nothing stable to describe.
      return []
  }
}

function describeHome(course: Lesson[]): string {
  return ['CURRENT PAGE: the course map, listing all lessons', '', ...course.map((l) => `Lesson ${l.id} — ${l.title}: ${l.promise}`)].join('\n')
}

export const isLocale = (x: unknown): x is Locale => typeof x === 'string' && (locales as readonly string[]).includes(x)

/** The system prompt for one page in one language, or null when the page is not one the assistant serves. */
export function buildSystemPrompt(locale: Locale, page: AskPage): string | null {
  const course = COURSES[locale]
  let pageText: string
  if (page.kind === 'home') pageText = describeHome(course)
  else {
    const lesson = course.find((l) => l.id === page.lessonId)
    if (!lesson) return null
    pageText = describeLesson(lesson)
  }
  return [TASK.replace('{language}', LANGUAGE[locale]), '', RULES, '', pageText].join('\n')
}
