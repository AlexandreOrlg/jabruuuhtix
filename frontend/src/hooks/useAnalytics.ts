import { useEffect } from 'react'

/**
 * Hook to inject analytics script in production.
 * Configure via environment variables:
 * - VITE_ANALYTICS_SRC: Script URL (e.g., Umami, Plausible)
 * - VITE_ANALYTICS_ID: Website/Site ID
 */
export function useAnalytics() {
    useEffect(() => {
        // Skip in development
        if (!import.meta.env.PROD) return

        const src = import.meta.env.VITE_ANALYTICS_SRC
        const websiteId = import.meta.env.VITE_ANALYTICS_ID

        // Skip if not configured
        if (!src || !websiteId) return

        // Create and inject analytics script
        const script = document.createElement('script')
        script.defer = true
        script.src = src
        script.dataset.websiteId = websiteId
        document.head.appendChild(script)

        // Cleanup on unmount
        return () => {
            script.remove()
        }
    }, [])
}
