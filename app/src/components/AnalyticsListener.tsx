import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ReactGA from 'react-ga4'

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

export default function AnalyticsListener() {
  const location = useLocation()

  useEffect(() => {
    if (!measurementId) return
    ReactGA.send({
      hitType: 'pageview',
      page: location.pathname + location.search,
    })
  }, [location])

  return null
}
