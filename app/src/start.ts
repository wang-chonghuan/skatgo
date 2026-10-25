import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'

// Clerk accounts (SKATGO-12). Its middleware reads the visitor's session on every page request and
// hands the result — and the publishable key, read here at runtime rather than baked into the build —
// to <ClerkProvider> through the server-rendered page. It protects nothing, and nothing on the site is
// behind a login but what the tournament, a private table and the forum ask for (SKATGO-13, SKATGO-117, SKATGO-118,
// SKATGO-123).
export const startInstance = createStart(() => ({
  requestMiddleware: [clerkMiddleware()],
}))
