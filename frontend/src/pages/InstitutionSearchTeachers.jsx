"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Search, ArrowLeft, Mail, Phone } from "lucide-react"
import axios from "axios"
import Logo from "../components/Logo"

import { API_URL } from "../config/api"

export default function InstitutionSearchTeachers() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    subject: "",
    experience: "",
    location: "",
  })
  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_URL}/teachers`, {
        params: filters,
        headers: { Authorization: `Bearer ${token}` },
      })
      setTeachers(response.data || [])
    } catch (error) {
      console.error("Failed to fetch teachers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchTeachers()
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
          <Link to="/dashboard/institution" className="btn btn-secondary btn-sm">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>
      </nav>

      <section style={{ padding: "2rem 0" }}>
        <div className="container" style={{ maxWidth: "1100px" }}>
          <h1 style={{ marginBottom: "2rem" }}>Search Teachers</h1>

          {/* Search Form */}
          <div className="card" style={{ marginBottom: "2rem" }}>
            <form onSubmit={handleSearch}>
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1rem" }}
              >
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Search</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    placeholder="Teacher name or skills"
                    className="form-control"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Subject</label>
                  <input
                    type="text"
                    value={filters.subject}
                    onChange={(e) => handleFilterChange("subject", e.target.value)}
                    placeholder="e.g., Math, Physics"
                    className="form-control"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Experience</label>
                  <select
                    value={filters.experience}
                    onChange={(e) => handleFilterChange("experience", e.target.value)}
                    className="form-control"
                  >
                    <option value="">Any</option>
                    <option value="0-2">0-2 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Location</label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    placeholder="City"
                    className="form-control"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Search size={18} /> Search Teachers
              </button>
            </form>
          </div>

          {/* Teachers Grid */}
          {loading ? (
            <div className="card text-center">Loading teachers...</div>
          ) : teachers.length === 0 ? (
            <div className="card text-center">
              <p>No teachers found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))" }}>
              {teachers.map((teacher) => (
                <div key={teacher._id} className="card">
                  <div style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e0e0e0" }}>
                    <h3 style={{ marginBottom: "0.25rem" }}>{teacher.name}</h3>
                    <p style={{ color: "#666", fontSize: "0.875rem" }}>{teacher.subjects?.join(", ")}</p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ marginBottom: "0.5rem" }}>
                      <strong>Experience:</strong> {teacher.experience} years
                    </p>
                    <p style={{ marginBottom: "0.5rem" }}>
                      <strong>Location:</strong> {teacher.city}
                    </p>
                    <p style={{ marginBottom: "0.5rem" }}>
                      <strong>Expected Salary:</strong> {teacher.expectedSalary}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                    {teacher.phone && (
                      <a
                        href={`tel:${teacher.phone}`}
                        className="btn btn-secondary btn-sm"
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Phone size={16} /> Call
                      </a>
                    )}
                    {teacher.email && (
                      <a
                        href={`mailto:${teacher.email}`}
                        className="btn btn-secondary btn-sm"
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Mail size={16} /> Email
                      </a>
                    )}
                  </div>

                  <button className="btn btn-primary" style={{ width: "100%" }}>
                    Message
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
