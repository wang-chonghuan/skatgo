// The service worker (SKATGO-185, public/sw.js): registered once a page has loaded, on a production build only, as
// /sw.js?v=<build> — each build a new version, so the offline pages it keeps are that build's. A browser without service
// workers, or one that refuses this one, simply goes on without it.

const BUILD = import.meta.env.VITE_BUILD_ID as string | undefined

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !BUILD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const register = () => void navigator.serviceWorker.register(`/sw.js?v=${BUILD}`, { scope: '/' }).catch(() => {})
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}
