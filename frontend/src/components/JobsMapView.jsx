"use client"

import { useEffect, useRef, useState } from "react"
import axios from "axios"

import { API_URL } from "../config/api"

export default function JobsMapView({ jobs = [], city, state, country, pinCode, token, latitude, longitude }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const geocodeCache = useRef({})

  console.log("[MAP] JobsMapView props:", { latitude, longitude, city, state, country })

  useEffect(() => {
    if (!window.google || !window.google.maps) {
      loadGoogleMapsAPI()
    } else {
      initializeMap()
    }

    return () => {
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null))
        markersRef.current = []
      }
    }
  }, [city, state, country, token, latitude, longitude])

  // Separate effect to handle location updates after map is initialized
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null && mapInstance.current) {
      console.log("[MAP] Location props updated, centering map on:", latitude, longitude)
      const location = { lat: latitude, lng: longitude }
      setUserLocation(location)
      mapInstance.current.setCenter(location)
      mapInstance.current.setZoom(12)
    }
  }, [latitude, longitude])

  const loadGoogleMapsAPI = () => {
    if (window.google && window.google.maps) {
      console.log("[MAP] Google Maps already loaded, initializing map")
      initializeMap()
      return
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      console.log("[MAP] Google Maps script already exists, waiting for load")
      return
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error("[MAP] Google Maps API key not found in environment variables")
      setError("Google Maps API key not configured. Please check your environment setup.")
      setLoading(false)
      return
    }

    console.log("[MAP] Loading Google Maps API with key:", apiKey.substring(0, 10) + "...")

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`
    script.async = true
    script.defer = true

    script.onload = () => {
      console.log("[MAP] Google Maps API script loaded successfully")
      if (window.google && window.google.maps) {
        initializeMap()
      } else {
        console.error("[MAP] Google Maps API loaded but window.google.maps not available")
        setError("Google Maps API loaded but initialization failed")
        setLoading(false)
      }
    }

    script.onerror = (error) => {
      console.error("[MAP] Failed to load Google Maps script:", error)
      setError("Failed to load Google Maps. Please check your internet connection and API key.")
      setLoading(false)
    }

    // Add global error handler for Google Maps API authentication failures
    window.gm_authFailure = () => {
      console.error("[MAP] Google Maps authentication failed - check API key and billing")
      setError("Google Maps authentication failed. Please check your API key configuration and billing setup.")
      setLoading(false)
    }

    document.head.appendChild(script)

    // Timeout fallback with retry
    setTimeout(() => {
      if (!window.google || !window.google.maps) {
        console.warn("[MAP] Google Maps loading timeout - retrying with different approach")
        // Try loading again with a different approach
        const retryScript = document.createElement('script')
        retryScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`
        retryScript.async = true
        retryScript.defer = true
        retryScript.onload = () => {
          console.log("[MAP] Retry successful")
          if (window.google && window.google.maps) {
            initializeMap()
          }
        }
        retryScript.onerror = () => {
          console.error("[MAP] Retry failed")
          setError("Google Maps loading timeout. Please check your internet connection and API key.")
          setLoading(false)
        }
        document.head.appendChild(retryScript)

        // Final timeout
        setTimeout(() => {
          if (!window.google || !window.google.maps) {
            setError("Google Maps loading timeout. Please check your internet connection and API key.")
            setLoading(false)
          }
        }, 15000)
      }
    }, 15000) // Reduced initial timeout to 15 seconds
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.error("[MAP] Map container or Google Maps not available")
      setError("Google Maps failed to load. Please check your internet connection and try again.")
      setLoading(false)
      return
    }

    try {
      // Determine initial center based on provided props or defaults
      let initialCenter = { lat: 20.5937, lng: 78.9629 } // Default to India center
      let initialZoom = 5

      // If latitude and longitude are provided, use them as initial center
      if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
        initialCenter = { lat: latitude, lng: longitude }
        initialZoom = 12
        console.log("[MAP] Initializing map with provided location:", latitude, longitude)
      } else if (state) {
        // Center map on Karnataka if state code is "KA"
        if (state === "KA") {
          initialCenter = { lat: 15.3173, lng: 75.7139 } // Coordinates for Karnataka
          initialZoom = 7
        } else if (city) {
          initialCenter = { lat: 20.5937, lng: 78.9629 }
          initialZoom = 5
        }
      }

      getCurrentLocation()

      const newMap = new window.google.maps.Map(mapRef.current, {
        zoom: initialZoom,
        center: initialCenter,
        styles: [
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry.fill",
            stylers: [{ color: "#ffffff" }, { lightness: 17 }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#ffffff" }, { lightness: 29 }, { weight: 0.2 }],
          },
          {
            featureType: "road.arterial",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }, { lightness: 18 }],
          },
          {
            featureType: "road.local",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }, { lightness: 16 }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }, { lightness: 21 }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#dedede" }, { lightness: 21 }],
          },
          {
            elementType: "labels.text.stroke",
            stylers: [{ visibility: "on" }, { color: "#ffffff" }, { lightness: 16 }],
          },
          {
            elementType: "labels.text.fill",
            stylers: [{ saturation: 36 }, { color: "#333333" }, { lightness: 40 }],
          },
          {
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#f2f2f2" }, { lightness: 19 }],
          },
          {
            featureType: "administrative",
            elementType: "geometry.fill",
            stylers: [{ color: "#fefefe" }, { lightness: 20 }],
          },
          {
            featureType: "administrative",
            elementType: "geometry.stroke",
            stylers: [{ color: "#fefefe" }, { lightness: 17 }, { weight: 1.2 }],
          },
        ],
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },
        mapTypeControl: false, // Disabled for cleaner look
        scaleControl: false, // Disabled for cleaner look
        streetViewControl: false, // Disabled for cleaner look
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        gestureHandling: "cooperative",
        disableDefaultUI: false,
      })

      mapInstance.current = newMap

      // Add event listener for map errors
      window.google.maps.event.addListener(newMap, 'tilesloaded', () => {
        console.log("[MAP] Map tiles loaded successfully")
        setLoading(false)
      })

      // Handle fullscreen changes to maintain proper centering
      window.google.maps.event.addListener(newMap, 'bounds_changed', () => {
        // Store current bounds for zoom fit control
        if (newMap.jobBounds) {
          newMap.currentBounds = newMap.getBounds()
        }
      })

      // Handle fullscreen exit to restore proper view
      window.google.maps.event.addDomListener(document, 'fullscreenchange', () => {
        if (!document.fullscreenElement) {
          // Exited fullscreen, restore proper zoom and center
          setTimeout(() => {
            if (userLocation) {
              newMap.setCenter(userLocation)
              newMap.setZoom(Math.min(newMap.getZoom(), 15))
            } else if (newMap.jobBounds) {
              newMap.fitBounds(newMap.jobBounds)
              const listener = window.google.maps.event.addListener(newMap, "idle", () => {
                if (newMap.getZoom() > 15) newMap.setZoom(15)
                window.google.maps.event.removeListener(listener)
              })
            }
          }, 100)
        }
      })

      const centerControlDiv = createCenterControl(newMap)
      newMap.controls[window.google.maps.ControlPosition.TOP_LEFT].push(centerControlDiv)

      const zoomFitControlDiv = createZoomFitControl(newMap)
      newMap.controls[window.google.maps.ControlPosition.TOP_LEFT].push(zoomFitControlDiv)

      fetchJobsAndPlaceMarkers(newMap)
    } catch (error) {
      console.error("[MAP] Error initializing map:", error)
      setError("Failed to initialize map. Please refresh the page and try again.")
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    // If latitude and longitude are provided as props, use them directly
    if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
      console.log("[MAP] Using provided location:", latitude, longitude)
      const location = { lat: latitude, lng: longitude }
      setUserLocation(location)
      if (mapInstance.current) {
        mapInstance.current.setCenter(location)
        mapInstance.current.setZoom(12)
        console.log("[MAP] Map centered on provided location")
      }
      return
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const location = { lat: latitude, lng: longitude }
          setUserLocation(location)
          if (mapInstance.current) {
            mapInstance.current.setCenter(location)
            mapInstance.current.setZoom(12)
          }
        },
        (error) => {
          console.warn("[MAP] Geolocation error:", error.message)
          // Fallback to geocoding if location is provided
          if (city && state) {
            geocodeLocation(`${city}, ${state}, ${country || 'India'}`)
          } else {
            // Default to Karnataka center if no location info
            const defaultLocation = { lat: 15.3173, lng: 75.7139 }
            setUserLocation(defaultLocation)
            if (mapInstance.current) {
              mapInstance.current.setCenter(defaultLocation)
              mapInstance.current.setZoom(7)
            }
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
      )
    } else {
      console.warn("[MAP] Geolocation not supported")
      if (city && state) {
        geocodeLocation(`${city}, ${state}, ${country || 'India'}`)
      } else {
        // Default to Karnataka center if no location info
        const defaultLocation = { lat: 15.3173, lng: 75.7139 }
        setUserLocation(defaultLocation)
        if (mapInstance.current) {
          mapInstance.current.setCenter(defaultLocation)
          mapInstance.current.setZoom(7)
        }
      }
    }
  }

  const geocodeLocation = async (address) => {
    try {
      const geocoder = new window.google.maps.Geocoder()
      const result = await new Promise((resolve, reject) =>
        geocoder.geocode({ address }, (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK) {
            resolve(results[0].geometry.location)
          } else {
            reject(new Error(`Geocoding failed: ${status}`))
          }
        })
      )
      const location = { lat: result.lat(), lng: result.lng() }
      setUserLocation(location)
      if (mapInstance.current) {
        mapInstance.current.setCenter(location)
        mapInstance.current.setZoom(12)
      }
    } catch {
      // ignore
    }
  }

  // New function to geocode job location if no coordinates
  const geocodeJobLocation = async (job) => {
    if (!window.google || !window.google.maps) return null
    const geocoder = new window.google.maps.Geocoder()

    const address = `${job.city || ''}, ${job.state || ''}, ${job.country || 'India'}`.trim()
    if (!address) return null

    if (geocodeCache.current[address]) {
      return geocodeCache.current[address]
    }

    try {
      const result = await new Promise((resolve, reject) =>
        geocoder.geocode({ address }, (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
            resolve(results[0].geometry.location)
          } else {
            reject(new Error(`Geocoding failed: ${status}`))
          }
        })
      )
      const location = { lat: result.lat(), lng: result.lng() }
      geocodeCache.current[address] = location
      return location
    } catch {
      return null
    }
  }

  const createCenterControl = (map) => {
    const controlButton = document.createElement("button")
    controlButton.classList.add('buttonStyle')
    controlButton.innerHTML = "📍 My Location"
    controlButton.title = "Click to center the map on your current location"
    controlButton.type = "button"
    controlButton.style.cssText = `
      background-color: #fff;
      border: 2px solid #fff;
      border-radius: 3px;
      box-shadow: 0 2px 6px rgba(0,0,0,.15);
      cursor: pointer;
      font-family: Roboto,Arial,sans-serif;
      font-size: 14px;
      line-height: 38px;
      margin: 4px 0 22px;
      padding: 0 8px;
      text-align: center;
      color: #1a5490;
      font-weight: 500;
      min-width: 120px;
      transition: all 0.2s ease;
    `
    controlButton.addEventListener("click", () => {
      if (userLocation) {
        map.setCenter(userLocation)
        map.setZoom(14)
      } else {
        getCurrentLocation()
      }
    })
    controlButton.addEventListener("mouseenter", () => {
      controlButton.style.backgroundColor = "#f8f9fa"
      controlButton.style.borderColor = "#e9ecef"
    })
    controlButton.addEventListener("mouseleave", () => {
      controlButton.style.backgroundColor = "#fff"
      controlButton.style.borderColor = "#fff"
    })
    const controlDiv = document.createElement("div")
    controlDiv.appendChild(controlButton)
    return controlDiv
  }

  const createZoomFitControl = (map) => {
    const controlButton = document.createElement("button")
    controlButton.classList.add('buttonStyle')
    controlButton.innerHTML = "🔍 Fit All Jobs"
    controlButton.title = "Click to fit all job markers on the map"
    controlButton.type = "button"
    controlButton.style.cssText = `
      background-color: #fff;
      border: 2px solid #fff;
      border-radius: 3px;
      box-shadow: 0 2px 6px rgba(0,0,0,.15);
      cursor: pointer;
      font-family: Roboto,Arial,sans-serif;
      font-size: 14px;
      line-height: 38px;
      margin: 4px 0 22px;
      padding: 0 8px;
      text-align: center;
      color: #1a5490;
      font-weight: 500;
      min-width: 120px;
    `
    controlButton.addEventListener("click", () => {
      if (map.jobBounds) {
        map.fitBounds(map.jobBounds)
        const listener = window.google.maps.event.addListener(map, "idle", () => {
          if (map.getZoom() > 15) map.setZoom(15)
          window.google.maps.event.removeListener(listener)
        })
      }
    })
    const controlDiv = document.createElement("div")
    controlDiv.appendChild(controlButton)
    return controlDiv
  }

  const fetchJobsAndPlaceMarkers = async (mapInstance) => {
    try {
      console.log("[MAP] Fetching jobs for map markers")
      const response = await axios.get(`${API_URL}/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { city, state, country, pinCode }
      })

      const jobs = response.data.jobs || []
      console.log(`[MAP] Fetched ${jobs.length} jobs for map`)

      markersRef.current.forEach((marker) => {
        if (marker.infoWindow) marker.infoWindow.close()
        marker.setMap(null)
      })
      markersRef.current = []

      if (jobs.length === 0) {
        console.log("[MAP] No jobs found, showing default map")
        setError(null) // Clear any previous errors
        setLoading(false)
        return
      }

      const bounds = new window.google.maps.LatLngBounds()
      let validJobsCount = 0

      for (const job of jobs) {
        try {
          let lat, lng

          if (job.coordinates && job.coordinates.coordinates && job.coordinates.coordinates.length >= 2) {
            [lng, lat] = job.coordinates.coordinates
          } else {
            const location = await geocodeJobLocation(job)
            if (location) {
              lat = location.lat
              lng = location.lng
            } else if (userLocation) {
              const radius = 0.05
              lat = userLocation.lat + (Math.random() - 0.5) * radius
              lng = userLocation.lng + (Math.random() - 0.5) * radius
            } else {
              lat = 20.5937 + (Math.random() - 0.5) * 1.0
              lng = 78.9629 + (Math.random() - 0.5) * 1.0
            }
          }

          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
            title: job.title,
            label: (validJobsCount + 1).toString(),
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#1a5490" stroke="white" stroke-width="3"/>
                  <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${validJobsCount + 1}</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 40)
            }
          })

          const infoWindow = new window.google.maps.InfoWindow({
              content: `
              <div style="padding: 15px; max-width: 280px; font-family: Arial, sans-serif; border-radius: 8px;">
                <h4 style="margin: 0 0 8px 0; color: #1a5490; font-size: 16px; font-weight: bold;">${job.title || "Position"}</h4>
                <p style="margin: 5px 0; color: #666; font-size: 14px; font-weight: 500;">${job.institutionId?.institutionName || "Institution"}</p>
                <p style="margin: 5px 0; color: #999; font-size: 12px;">📍 ${job.city || job.state ? `${job.city || ''}, ${job.state || ''}`.trim() : "Location TBD"}</p>
                <p style="margin: 5px 0; color: #999; font-size: 12px;">🏷️ Postal Code: ${job.pinCode || "N/A"}</p>
                <p style="margin: 5px 0; color: #666; font-size: 12px;">💰 ${job.salaryRange || "Salary TBD"}</p>
                <a href="/jobs/${job._id}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #1a5490; color: white; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 12px;">View Details →</a>
              </div>
            `,
          })

          marker.addListener("click", () => {
            markersRef.current.forEach((m) => {
              if (m.infoWindow) m.infoWindow.close()
            })
            infoWindow.open(mapInstance, marker)
          })

          marker.infoWindow = infoWindow
          markersRef.current.push(marker)
          bounds.extend(marker.getPosition())
          validJobsCount++

        } catch {
          // skip errors
        }
      }

      if (validJobsCount > 0) {
        mapInstance.jobBounds = bounds
        console.log(`[MAP] Successfully placed ${validJobsCount} job markers on map`)

        // If user location is available, center on user location instead of fitting to all jobs
        if (userLocation) {
          mapInstance.setCenter(userLocation)
          mapInstance.setZoom(12)
          console.log("[MAP] Centered on user location instead of job bounds")
        } else {
          // Center on India center instead of fitting bounds when no user location
          const indiaCenter = { lat: 20.5937, lng: 78.9629 }
          mapInstance.setCenter(indiaCenter)
          mapInstance.setZoom(5)
          console.log("[MAP] Centered on India center since no user location")
        }
      } else {
        console.log("[MAP] No valid job locations found to display on map")
        // Center on user location or India center if no jobs
        if (userLocation) {
          mapInstance.setCenter(userLocation)
          mapInstance.setZoom(12)
        } else {
          const indiaCenter = { lat: 20.5937, lng: 78.9629 }
          mapInstance.setCenter(indiaCenter)
          mapInstance.setZoom(5)
        }
      }
      setLoading(false)
      setError(null) // Clear any errors when jobs are loaded successfully
    } catch (error) {
      setError("Failed to load jobs")
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div
        style={{
          width: "100%",
          height: "500px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ textAlign: "center", color: "#666" }}>
          <p>{error}</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: "100%" }}>
      <div
        ref={mapRef}
        id="map"
        style={{
          width: "100%",
          height: "450px",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid #ddd",
          background: loading ? "#f9fafb" : "white",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          marginTop: "100px",   // 🔥 MOVE MAP DOWN
          marginBottom: "20px"  // 🔥 ADD SPACE BELOW MAP
        }}
      />
     
       {/* Info Section */}
    <div
      style={{
        marginTop: "1.5rem",
        fontSize: "0.95rem",
        textAlign: "center",
        color: "#444",
        lineHeight: "2.0",       // 🔥 Increased spacing between lines
      }}
    >
      <p style={{ marginBottom: "14px" }}>📍 Real-time location-based job search</p>

      <p style={{ marginBottom: "14px" }}>
        Use the controls to navigate: 📍 My Location | 🔍 Fit All Jobs
      </p>

      {loading && (
        <p style={{ marginBottom: "14px", color: "#1a5490" }}>
          Loading jobs...
        </p>
      )}

      {userLocation ? (
        <p
          style={{
            marginBottom: "14px",
            color: "#1a5490",
            fontWeight: "600",
          }}
        >
          📍 Showing jobs near ({userLocation.lat.toFixed(2)}, {userLocation.lng.toFixed(2)})
        </p>
      ) : (
        <p
          style={{
            marginBottom: "14px",
            color: "#888",
            fontStyle: "italic",
          }}
        >
          📍 Enable location access for personalized job results near you
        </p>
      )}
    </div>
  </div>
)
}