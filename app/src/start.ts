import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'

// Clerk accounts (SKATGO-12). Its middleware reads the visitor's session on every page request and
// hands the result — and the publishable key, read here at runtime rather than baked into the build —
// to <ClerkProvider> through the server-rendered page. It protects nothing by itself: the only thing
// behind a login is the assistant, and its endpoint checks the session on its own (lib/ask/handler.ts).
export const startInstance = createStart(() => ({
  requestMiddleware: [clerkMiddleware()],
}))
