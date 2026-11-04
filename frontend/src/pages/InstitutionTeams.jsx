"use client";

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit2, User } from "lucide-react";
import axios from "axios";

import { API_URL } from "../config/api";

export default function InstitutionTeams() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", role: "Recruiter" });
  const [editMemberId, setEditMemberId] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("accessToken");
  const navigate = useNavigate();

  // ------------------------------ FETCH TEAM MEMBERS ------------------------------
  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    if (!token) {
      alert("Authentication token missing. Please log in again.");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/institution/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamMembers(response.data.members || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      alert("Failed to fetch team members, please try again.");
    }
  };

  // ------------------------------ MODAL HANDLERS ------------------------------
  const openAddModal = () => {
    setFormData({ name: "", email: "", role: "Recruiter" });
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setFormData({ name: member.name, email: member.email, role: member.role });
    setEditMemberId(member._id);
    setIsEditMode(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ name: "", email: "", role: "Recruiter" });
    setEditMemberId(null);
    setIsEditMode(false);
    setLoading(false);
  };

  // ------------------------------ ADD TEAM MEMBER ------------------------------
  const addTeamMember = async () => {
    if (!formData.name || !formData.email) {
      alert("Please enter both name and email.");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API_URL}/institution/teams`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      closeModal();
      fetchTeamMembers();
    } catch (error) {
      console.error("Error adding member:", error);
      alert(error.response?.data?.error || "Failed to add team member, please try again.");
      setLoading(false);
    }
  };

  // ------------------------------ UPDATE TEAM MEMBER ------------------------------
  const updateTeamMember = async () => {
    if (!formData.name || !formData.email) {
      alert("Please enter both name and email.");
      return;
    }

    try {
      setLoading(true);

      await axios.put(`${API_URL}/institution/teams/${editMemberId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      closeModal();
      fetchTeamMembers();
    } catch (error) {
      console.error("Error updating member:", error);
      alert(error.response?.data?.error || "Failed to update team member.");
      setLoading(false);
    }
  };

  // ------------------------------ REMOVE TEAM MEMBER (FIXED) ------------------------------
  const removeTeamMember = async (id) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      setLoading(true);

      await axios.delete(`${API_URL}/institution/teams/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchTeamMembers();
      setLoading(false);
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove team member, please try again.");
      setLoading(false);
    }
  };

  // ------------------------------ ROLE COLORS ------------------------------
  const getRoleColor = (role) => {
    const colors = {
      Admin: "#e74c3c",
      Recruiter: "#1a5490",
      Viewer: "#95a5a6",
    };
    return colors[role] || "#666";
  };

  // ------------------------------ RENDER UI ------------------------------
  return (
    <div>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand">TeacherWorld</Link>
          <Link to="/dashboard/institution" className="btn btn-secondary btn-sm">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>
      </nav>

      <section style={{ padding: "2rem 0", background: "#f5f5f5", minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
            <h1>Teams & Roles</h1>
            <button onClick={openAddModal} className="btn btn-primary" disabled={loading}>
              <Plus size={18} /> Add Team Member
            </button>
          </div>

          {/* ------------------------------ TEAM MEMBER GRID ------------------------------ */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {teamMembers.map((member) => (
              <div key={member._id} className="card">

                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      background: "#e0e7ff",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={24} style={{ color: "#1a5490" }} />
                  </div>

                  <div>
                    <h4 style={{ margin: 0 }}>{member.name}</h4>
                    <p style={{ margin: "4px 0 0", color: "#666" }}>{member.email}</p>
                  </div>
                </div>

                <div style={{ display: "flex", marginTop: "1rem", justifyContent: "space-between" }}>
                  <span style={{ background: getRoleColor(member.role), color: "white", padding: "4px 10px", borderRadius: "9999px", fontSize: "0.8rem" }}>
                    {member.role}
                  </span>
                  <p style={{ fontSize: "0.75rem", color: "#999" }}>
                    Joined {member.joinDate ? new Date(member.joinDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button className="btn btn-light" onClick={() => openEditModal(member)} disabled={loading}>
                    <Edit2 size={16} /> Edit
                  </button>

                  <button className="btn btn-danger" onClick={() => removeTeamMember(member._id)} disabled={loading}>
                    <Trash2 size={16} /> Remove
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* ------------------------------ MODAL ------------------------------ */}
          {showModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}
            >
              <div className="card" style={{ width: "90%", maxWidth: "500px" }}>
                
                <h2 style={{ marginBottom: "1rem" }}>
                  {isEditMode ? "Edit Team Member" : "Add Team Member"}
                </h2>

                <label>Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <label style={{ marginTop: "1rem" }}>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />

                <label style={{ marginTop: "1rem" }}>Role</label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option>Admin</option>
                  <option>Recruiter</option>
                  <option>Viewer</option>
                </select>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  {isEditMode ? (
                    <button className="btn btn-primary" onClick={updateTeamMember} disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={addTeamMember} disabled={loading}>
                      {loading ? "Adding..." : "Add Member"}
                    </button>
                  )}

                  <button className="btn btn-secondary" onClick={closeModal} disabled={loading}>
                    Cancel
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
