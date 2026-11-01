/** This page's own Clerk session token, fresh, for the server to know the account by. The session cookie alone lasts a
 *  minute and is renewed by Clerk's script in the background — which a hidden tab or a sleeping laptop may not have done
 *  yet, and which another app on the same host may have overwritten (localhost's ports share cookies) — so a request on
 *  it alone could be told to sign in while the page shows the account signed in. `getToken` renews the token when it
 *  must. None for a guest, or a local test account, whose own cookie speaks for it. */
export async function sessionToken(): Promise<string | null> {
  try {
    const clerk = (window as { Clerk?: { session?: { getToken: () => Promise<string | null> } | null } }).Clerk
    return (await clerk?.session?.getToken()) ?? null
  } catch {
    return null
  }
}

/** A JSON request's headers, with the session token where there is one. */
export async function jsonHeaders(): Promise<Record<string, string>> {
  const token = await sessionToken()
  return { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }
}
