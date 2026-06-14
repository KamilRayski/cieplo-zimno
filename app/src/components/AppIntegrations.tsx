import { useEffect } from 'react'
import Hotjar from '@hotjar/browser'
import ReactGA from 'react-ga4'

const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID
const hotjarSiteId = import.meta.env.VITE_HOTJAR_SITE_ID
const hotjarVersion = 6

/** GA4 w React; Hotjar/Contentsquare — skrypt w index.html */
export default function AppIntegrations() {
  useEffect(() => {
    if (gaId) {
      ReactGA.initialize(gaId)
    }
  }, [])

  useEffect(() => {
    const siteId = hotjarSiteId ? Number(hotjarSiteId) : NaN
    if (!Number.isNaN(siteId) && siteId > 0) {
      Hotjar.init(siteId, hotjarVersion)
    }
  }, [])

  return null
}
