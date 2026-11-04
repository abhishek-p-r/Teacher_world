"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { Search, MapPin, Briefcase, DollarSign, Loader, Map, List } from "lucide-react"
import axios from "axios"
import Logo from "../components/Logo"
import JobsMapView from "../components/JobsMapView"

import { API_URL } from "../config/api"
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [useLocation, setUseLocation] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [viewMode, setViewMode] = useState("list") // "list" or "map"
  const mapRef = useRef(null)

  useEffect(() => {
    if (navigator.geolocation && useLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ latitude, longitude })
          searchNearbyJobs(latitude, longitude)
        },
        (error) => {
          console.error("Geolocation error:", error)
          // Fallback to regular job search when geolocation fails
          fetchJobs()
        },
      )
    } else {
      fetchJobs()
    }
  }, [useLocation])

  const fetchJobs = async (search = "", city = "") => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/jobs`, {
        params: {
          search: search || undefined,
          city: city || undefined,
          limit: 50,
        },
      })
      setJobs(response.data.jobs)
    } catch (error) {
      console.error("[v0] Failed to fetch jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchNearbyJobs = async (latitude, longitude, radius = 50) => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/jobs/nearby`, {
        params: { latitude, longitude, radius },
      })
      setJobs(response.data.jobs)
    } catch (error) {
      console.error("[v0] Nearby search failed:", error)
      fetchJobs()
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (useLocation && userLocation) {
      searchNearbyJobs(userLocation.latitude, userLocation.longitude)
    } else {
      fetchJobs(searchQuery, selectedCity)
    }
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
          <ul className="navbar-nav">
            <li>
              <Link to="/jobs">Jobs</Link>
            </li>
            <li>
              <Link to="/login-teacher">Login</Link>
            </li>
          </ul>
        </div>
      </nav>

      <section
        style={{
          background: "linear-gradient(135deg, #1a5490 0%, #0f3a63 100%)",
          color: "white",
          padding: "2rem 0",
          marginBottom: "2rem",
        }}
      >
        <div className="container">
          <h1 style={{ marginBottom: "1.5rem" }}>Find Teaching Jobs</h1>

          <form
            onSubmit={handleSearch}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
              />
              <input
                type="text"
                placeholder="City or Location"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="form-control"
              />
            </div>
            <button type="submit" className="btn btn-accent">
              <Search size={20} />
              Search
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <input
              type="checkbox"
              id="useLocation"
              checked={useLocation}
              onChange={(e) => setUseLocation(e.target.checked)}
            />
            <label htmlFor="useLocation">Use my current location</label>
            {userLocation && (
              <span style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                📍 {userLocation.latitude.toFixed(2)}, {userLocation.longitude.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* View Toggle Section */}
      <section style={{ padding: "1rem 0", backgroundColor: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#666" }}>
                {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
                {userLocation && (
                  <span style={{ marginLeft: "0.5rem", color: "#1a5490" }}>
                    📍 Near {userLocation.latitude.toFixed(2)}, {userLocation.longitude.toFixed(2)}
                  </span>
                )}
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setViewMode("list")}
                className={`btn ${viewMode === "list" ? "btn-primary" : "btn-outline"} btn-sm`}
                style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <List size={16} />
                List View
              </button>
              <button
                onClick={() => {
                  setViewMode("map")
                  // Automatically enable location when switching to map view
                  if (!userLocation && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const { latitude, longitude } = position.coords
                        setUserLocation({ latitude, longitude })
                      },
                      (error) => {
                        console.error("Geolocation error:", error)
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    )
                  }
                }}
                className={`btn ${viewMode === "map" ? "btn-primary" : "btn-outline"} btn-sm`}
                style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <Map size={16} />
                Map View
              </button>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "2rem 0" }}>
        <div className="container">
          {loading ? (
            <div className="text-center">
              <Loader className="animate-spin" size={40} style={{ margin: "0 auto" }} />
              <p style={{ marginTop: "1rem" }}>Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="card text-center">
              <p>No jobs found. Try different search criteria or adjust the location radius.</p>
            </div>
          ) : viewMode === "map" ? (
            <JobsMapView
              jobs={jobs}
              city={selectedCity}
              state=""
              country=""
              pinCode=""
              token=""
              latitude={userLocation?.latitude}
              longitude={userLocation?.longitude}
            />
          ) : (
            <div className="grid">
              {jobs.map((job) => (
                <Link key={job._id} to={`/jobs/${job._id}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ cursor: "pointer" }}>
                    <div className="flex justify-between">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          {job.institutionId?.photo && (
                            <img
                              src={`${API_URL.replace('/api', '')}${job.institutionId.photo}`}
                              alt={job.institutionId?.institutionName || 'Institution'}
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          )}
                          <h3>{job.title}</h3>
                        </div>
                        <p style={{ color: "#666", marginBottom: "1rem" }}>
                          {job.institutionId?.institutionName || "Institution"}
                        </p>

                        <div className="flex gap-2" style={{ marginBottom: "1rem", flexWrap: "wrap" }}>
                          {job.city && (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                color: "#666",
                                fontSize: "0.875rem",
                              }}
                            >
                              <MapPin size={16} /> {job.city}
                              {job.distance && <span> ({job.distance.toFixed(1)} km)</span>}
                            </span>
                          )}
                          {job.salary?.min && (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                color: "#666",
                                fontSize: "0.875rem",
                              }}
                            >
                              <DollarSign size={16} /> ${job.salary.min}-${job.salary.max}
                            </span>
                          )}
                          {job.employmentType && (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                color: "#666",
                                fontSize: "0.875rem",
                              }}
                            >
                              <Briefcase size={16} /> {job.employmentType}
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: "0.875rem", color: "#888", lineHeight: "1.5" }}>
                          {job.description?.substring(0, 100)}...
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <button className="btn btn-primary btn-sm">View & Apply</button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
