// The site's model (SKATGO-124, SKATGO-142): `gpt-5.6-luna` at low effort (the human: 「用luna low就行」), through the
// service's `LLM_BASE_URL` / `LLM_API_KEY`. The forum's translations and Lina's and Noah's table talk both ask it here.

const MODEL = 'gpt-5.6-luna'
const EFFORT = 'low'

/** Whether the service is given the model at all; without it nothing is translated and nobody talks. */
export const modelReady = () => !!process.env.LLM_BASE_URL && !!process.env.LLM_API_KEY

/** One answer as a JSON object, or a thrown error: the model unreachable, slower than `timeoutMs`, or not JSON. */
export async function askModel(system: string, user: string, timeoutMs: number): Promise<Record<string, unknown>> {
  const res = await fetch(`${process.env.LLM_BASE_URL!.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.LLM_API_KEY}` },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || MODEL,
      reasoning_effort: EFFORT,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  })
  if (!res.ok) {
    await res.body?.cancel()
    throw new Error(`upstream ${res.status}`)
  }
  return JSON.parse((await res.json()).choices?.[0]?.message?.content ?? '{}') as Record<string, unknown>
}
