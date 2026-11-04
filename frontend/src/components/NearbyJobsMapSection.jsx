"use client"

import { useState, useEffect } from "react"
import { MapPin, Loader } from "lucide-react"
import axios from "axios"
import JobsMapView from "./JobsMapView"

import { API_URL } from "../config/api"

export default function NearbyJobsMapSection({ token }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [mapLoading, setMapLoading] = useState(true)

  useEffect(() => {
    loadGoogleMaps()
    fetchProfile()
  }, [token])

  // Update overall loading state
  useEffect(() => {
    setLoading(profileLoading || mapLoading)
  }, [profileLoading, mapLoading])

  // Add a fallback to ensure map loads even if profile fails
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (profileLoading && !profile) {
        console.warn("[MAP] Fallback: Setting default profile after 10 seconds")
        setProfile({ city: null, state: null, country: null })
        setProfileLoading(false)
      }
    }, 10000)

    return () => clearTimeout(fallbackTimer)
  }, [profileLoading, profile])

  const loadGoogleMaps = () => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log("[MAP] Google Maps already loaded")
      setMapLoaded(true)
      setMapLoading(false)
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      console.log("[MAP] Google Maps script already exists, waiting...")
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded)
          console.log("[MAP] Google Maps loaded via existing script")
          setMapLoaded(true)
          setMapLoading(false)
        }
      }, 100)
      return
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error("[MAP] No Google Maps API key found")
      setMapError("Google Maps API key not configured. Please check your environment variables.")
      setLoading(false)
      return
    }

    console.log("[MAP] Loading Google Maps API...")

    // Load Google Maps API with proper error handling
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`
    script.async = true
    script.defer = true

    script.onload = () => {
      console.log("[MAP] Google Maps API script loaded successfully")
      // Double check that the API is actually available
      setTimeout(() => {
        if (window.google && window.google.maps) {
          console.log("[MAP] Google Maps API fully initialized")
          setMapLoaded(true)
          setMapLoading(false)
        } else {
          console.error("[MAP] Google Maps API script loaded but not available")
          setMapError("Google Maps failed to initialize. Please refresh the page.")
          setMapLoading(false)
        }
      }, 100)
    }

    script.onerror = (error) => {
      console.error("[MAP] Failed to load Google Maps script:", error)
      setMapError("Failed to load Google Maps. This may be due to network issues or API configuration.")
      setMapLoading(false)
    }

    // Add global error handler for Google Maps API errors
    window.gm_authFailure = () => {
      console.error("[MAP] Google Maps authentication failed - check API key and billing")
      setMapError("Google Maps authentication failed. Please check your API key configuration and billing setup.")
      setMapLoading(false)
    }

    document.head.appendChild(script)

    // Timeout fallback - increased to give more time
    setTimeout(() => {
      if (!window.google || !window.google.maps) {
        console.warn("[MAP] Google Maps loading timeout after 15 seconds")
        setMapError("Google Maps loading timeout. This may be due to network issues.")
        setMapLoading(false)
      }
    }, 15000)
  }

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setProfile(response.data)
    } catch (error) {
      console.error("Error fetching profile:", error)
      // Set a default profile or empty object so map can still work
      setProfile({ city: null, state: null, country: null })
    } finally {
      setProfileLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
        <Loader size={32} style={{ margin: "0 auto 1rem", color: "#1a5490", animation: "spin 1s linear infinite" }} />
        <p>Loading your nearby jobs...</p>
      </div>
    )
  }

  if (mapError) {
    return (
      <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗺️</div>
        <h4 style={{ marginBottom: "1rem", color: "#333" }}>Map Unavailable</h4>
        <p style={{ color: "#666", marginBottom: "1rem" }}>{mapError}</p>
        <p style={{ color: "#999", fontSize: "0.875rem" }}>
          Jobs will still be displayed below. You can browse jobs without the map.
        </p>
      </div>
    )
  }

  if (!mapLoaded) {
    return (
      <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
        <Loader size={32} style={{ margin: "0 auto 1rem", color: "#1a5490", animation: "spin 1s linear infinite" }} />
        <p>Loading map...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👤</div>
        <h4 style={{ marginBottom: "1rem", color: "#333" }}>Profile Loading</h4>
        <p style={{ color: "#666" }}>Please wait while we load your profile information...</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "#1a5490", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MapPin size={24} /> Jobs Near {profile?.city || "You"}
        </h3>
        <p style={{ color: "#666" }}>
          Showing job opportunities near{" "}
          <strong>
            {profile?.city}, {profile?.state}
          </strong>
        </p>
      </div>

      <div className="card" style={{ padding: "1rem", height: "470px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <JobsMapView city={profile?.city} state={profile?.state} country={profile?.country} token={token} />
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#666", textAlign: "center" }}>
        <p>Click on markers to view job details. Update your location in your profile to see jobs in different areas.</p>
        <p style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
          💡 Jobs are also listed below the map for easy browsing
        </p>
      </div>
    </div>
  )
}
