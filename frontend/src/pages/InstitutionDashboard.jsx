//   import { useState, useEffect } from "react"
// import { Link, useNavigate } from "react-router-dom"
// import { LogOut, Plus, Users, TrendingUp, BarChart3, Upload, Edit, Trash2, Video } from "lucide-react"
// import { logout } from "../lib/auth"
// import Logo from "../components/Logo"
// import InterviewList from "../components/InterviewList"


// // Helper to ensure URLs returned from the API are absolute so the browser can load them
// const normalizeUrl = (url) => {
//   if (!url) return null
//   if (/^https?:\/\//i.test(url)) return url
//   const base = API_URL.replace(/\/api\/?$/i, "")
//   if (url.startsWith("/")) return `${base}${url}`
//   return `${base}/${url}`
// }

// export default function InstitutionDashboard() {
//   const [jobs, setJobs] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [stats, setStats] = useState({
//     shortlisted: 0,
//     underReview: 0,
//     interviewed: 0,
//     hired: 0,
//     applied: 0,
//     viewed: 0,
//     accepted: 0,
//     rejected: 0,
//   })

//   const [profile, setProfile] = useState(null)
//   const [unreadMessages, setUnreadMessages] = useState(0)

//   // Added states for interviews
//   const [interviews, setInterviews] = useState([])
//   const [loadingInterviews, setLoadingInterviews] = useState(true)
//   const [errorInterviews, setErrorInterviews] = useState(null)

//   // State for showing instruction modal
//   const [showInstructionModal, setShowInstructionModal] = useState(false)
//   const [dontAskAgain, setDontAskAgain] = useState(false)

//   const navigate = useNavigate()
//   const token = localStorage.getItem("accessToken")

//   // On mount, check localStorage for 'don't ask again' flag and set showInstructionModal accordingly
//   useEffect(() => {
//     const dontAskFlag = localStorage.getItem("institutionDashboardInstructionDontAskAgain")
//     if (dontAskFlag === "true") {
//       setShowInstructionModal(false)
//       setDontAskAgain(true)
//     } else {
//       setShowInstructionModal(true)
//     }
//   }, [])

//   useEffect(() => {
//     const token = localStorage.getItem("accessToken")
//     const user = localStorage.getItem("user")
//     if (!token || !user) {
//       navigate("/login-institution")
//       return
//     }

//     fetchInstitutionProfile()
//     fetchInstitutionJobs()
//     fetchInstitutionStats()
//     fetchUnreadMessages()
//     fetchInterviews() // Added fetch call for interviews
//   }, [navigate])

//   // Added fetchInterviews function
//   const fetchInterviews = async () => {
//     setLoadingInterviews(true)
//     setErrorInterviews(null)
//     try {
//       const response = await fetch(`${API_URL}/interviews`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       if (!response.ok) throw new Error("Failed to fetch interviews")
//       const data = await response.json()
//       setInterviews(data)
//     } catch (error) {
//       setErrorInterviews(error.message)
//     } finally {
//       setLoadingInterviews(false)
//     }
//   }

//   // Added joinLiveInterview function stub
//   const joinLiveInterview = (roomId) => {
//     alert(`Joining live interview room: ${roomId}`)
//     // Actual implementation might redirect to live interview page etc.
//   }

//   const fetchInstitutionJobs = async () => {
//     try {
//       const response = await fetch(`${API_URL}/jobs/institution/jobs`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       if (!response.ok) throw new Error("Failed to fetch jobs")
//       const jobsData = await response.json()
//       setJobs(jobsData)
//     } catch (error) {
//       console.error("Failed to fetch institution jobs:", error.message)
//       setJobs([])
//     } finally {
//       setLoading(false)
//     }
//   }

//   const fetchInstitutionProfile = async () => {
//     try {
//       const response = await fetch(`${API_URL}/profile/institution`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       if (!response.ok) throw new Error("Failed to fetch profile")
//       const prof = await response.json()
//       if (prof.photo) prof.photo = normalizeUrl(prof.photo)
//       setProfile(prof)
//     } catch (error) {
//       console.error("Failed to fetch institution profile:", error.message)
//       setProfile(null)
//     }
//   }

//   const fetchInstitutionStats = async () => {
//     try {
//       const response = await fetch(`${API_URL}/applications/stats/institution`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       if (!response.ok) throw new Error("Failed to fetch stats")
//       const statsData = await response.json()
//       setStats(statsData)
//     } catch (error) {
//       console.error("Failed to fetch institution stats:", error.message)
//       setStats({
//         shortlisted: 0,
//         underReview: 0,
//         interviewed: 0,
//         hired: 0,
//         applied: 0,
//         viewed: 0,
//         accepted: 0,
//         rejected: 0,
//       })
//     }
//   }

//   const fetchUnreadMessages = async () => {
//     try {
//       const response = await fetch(`${API_URL}/messages/unread-count`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       if (!response.ok) throw new Error("Failed to fetch unread messages")
//       const data = await response.json()
//       setUnreadMessages(data.count || 0)
//     } catch (error) {
//       console.error("Failed to fetch unread messages:", error.message)
//     }
//   }

//   // Photo Upload Handler
//   const handlePhotoUpload = async (e) => {
//     const file = e.target.files[0]
//     if (!file) return

//     const formData = new FormData()
//     formData.append("photo", file)

//     try {
//       const response = await fetch(`${API_URL}/profile/institution/photo`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         body: formData,
//       })
//       if (!response.ok) throw new Error("Upload failed")

//       const data = await response.json()
//       const updatedPhoto = normalizeUrl(data.photoUrl || data.photo || data.url)
//       setProfile((prev) => ({ ...prev, photo: updatedPhoto }))

//       // Persist and broadcast the update so other tabs/components update live
//       try {
//         const cached = JSON.parse(localStorage.getItem("institutionProfile") || "{}")
//         const merged = { ...cached, photo: updatedPhoto }
//         localStorage.setItem("institutionProfile", JSON.stringify(merged))

//         const user = JSON.parse(localStorage.getItem("user") || "{}")
//         user.profilePhoto = updatedPhoto
//         localStorage.setItem("user", JSON.stringify(user))

//         window.dispatchEvent(new CustomEvent("institutionProfileUpdated", { detail: { photo: updatedPhoto } }))
//       } catch (error) {
//         console.error("Error persisting photo update:", error)
//       }
//     } catch (error) {
//       console.error("Photo upload failed:", error)
//       alert("Failed to upload photo")
//     }
//   }

//   const handleEditJob = (jobId) => {
//     navigate(`/institution/edit-job/${jobId}`)
//   }

//   const handleDeleteJob = async (jobId) => {
//     if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
//       return
//     }

//     try {
//       await fetch(`${API_URL}/jobs/${jobId}`, {
//         method: "DELETE",
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       alert("Job deleted successfully!")
//       fetchInstitutionJobs()
//     } catch (error) {
//       console.error("Failed to delete job:", error)
//       alert("Failed to delete job")
//     }
//   }

//   const handleLogout = () => {
//     logout()
//     navigate("/")
//   }


//   useEffect(() => {
//     const onAppLogout = () => {
//       window.location.href = "/"
//     }
//     window.addEventListener("app:logout", onAppLogout)

//     const handleProfileUpdate = () => {
//       fetchInstitutionProfile()
//     }

//     window.addEventListener("institutionProfileUpdated", handleProfileUpdate)

//     return () => {
//       window.removeEventListener("app:logout", onAppLogout)
//       window.removeEventListener("institutionProfileUpdated", handleProfileUpdate)
//     }
//   }, [])

//   // Handler for "Don't ask again" checkbox toggle
//   const onDontAskAgainChange = (e) => {
//     setDontAskAgain(e.target.checked)
//   }

//   // Handler for closing the instruction modal
//   const closeInstructionModal = () => {
//     if (dontAskAgain) {
//       localStorage.setItem("institutionDashboardInstructionDontAskAgain", "true")
//     }
//     setShowInstructionModal(false)
//   }

//   return (
//     <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
//       <nav className="navbar">
//         <div className="container flex justify-between">
//           <Link to="/" className="navbar-brand" style={{ textDecoration: "none" }}>
//             <Logo />
//           </Link>
//           <button onClick={handleLogout} className="btn btn-secondary btn-sm">
//             <LogOut size={18} /> Logout
//           </button>
//         </div>
//       </nav>

//       <section style={{ padding: "2rem 0", background: "#f8f9fa", minHeight: "calc(100vh - 80px)" }}>
//         <div className="container">
//           <div className="grid" style={{ gridTemplateColumns: "250px 1fr", gap: "2rem" }}>
//             {/* Sidebar */}
//             <div>
//               {/* Institution Profile Card */}
//               <div className="card" style={{ marginBottom: "1.5rem", background: "white" }}>
//                 <div style={{ textAlign: "center", marginBottom: "1rem", position: "relative" }}>
//                   {profile?.photo ? (
//                     <img
//                       src={profile.photo}
//                       alt="Institution Logo"
//                       style={{
//                         width: "80px",
//                         height: "80px",
//                         borderRadius: "50%",
//                         objectFit: "cover",
//                         margin: "0 auto",
//                         border: "3px solid #1a5490",
//                       }}
//                     />
//                   ) : (
//                     <div
//                       style={{
//                         width: "80px",
//                         height: "80px",
//                         borderRadius: "50%",
//                         background: "#1a5490",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         margin: "0 auto",
//                         fontSize: "2.5rem",
//                         color: "white",
//                       }}
//                     >
//                       🏫
//                     </div>
//                   )}

//                   <label
//                     htmlFor="photoUpload"
//                     style={{
//                       position: "absolute",
//                       bottom: 0,
//                       right: "calc(50% - 40px)",
//                       background: "#1a5490",

//   useEffect(() => {
//     const token = localStorage.getItem("accessToken")
//     const user = localStorage.getItem("user")
//     if (!token || !user) {
//       navigate("/login-institution")
//       return
//     }

//     fetchInstitutionProfile()
//     fetchInstitutionJobs()
//     fetchInstitutionStats()
//     fetchUnreadMessages()
//     fetchInterviews() // Added fetch call for interviews
//   }, [navigate])

//   // Added fetchInterviews function
//   const fetchInterviews = async () => {
//     setLoadingInterviews(true)
//     setErrorInterviews(null)
//     try {
//       const response = await fetch(`${API_URL}/interviews`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       if (!response.ok) throw new Error("Failed to fetch interviews")
//       const data = await response.json()
//       setInterviews(data)
//     } catch (error) {
//       setErrorInterviews(error.message)
//     } finally {
//       setLoadingInterviews(false)
//     }
//   }

//   // Added joinLiveInterview function stub
//   const joinLiveInterview = (roomId) => {
//     alert(`Joining live interview room: ${roomId}`)
//     // Actual implementation might redirect to live interview page etc.
//   }


//   const fetchInstitutionJobs = async () => {
//     try {
//       const response = await fetch(`${API_URL}/jobs/institution/jobs`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       if (!response.ok) throw new Error("Failed to fetch jobs")
//       const jobsData = await response.json()
//       setJobs(jobsData)
//     } catch (error) {
//       console.error("Failed to fetch institution jobs:", error.message)
//       setJobs([])
//     } finally {
//       setLoading(false)
//     }
//   }

//   const fetchInstitutionProfile = async () => {
//     try {
//       const response = await fetch(`${API_URL}/profile/institution`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       if (!response.ok) throw new Error("Failed to fetch profile")
//       const prof = await response.json()
//       if (prof.photo) prof.photo = normalizeUrl(prof.photo)
//       setProfile(prof)
//     } catch (error) {
//       console.error("Failed to fetch institution profile:", error.message)
//       setProfile(null)
//     }
//   }

//   const fetchInstitutionStats = async () => {
//     try {
//       const response = await fetch(`${API_URL}/applications/stats/institution`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       if (!response.ok) throw new Error("Failed to fetch stats")
//       const statsData = await response.json()
//       setStats(statsData)
//     } catch (error) {
//       console.error("Failed to fetch institution stats:", error.message)
//       setStats({
//         shortlisted: 0,
//         underReview: 0,
//         interviewed: 0,
//         hired: 0,
//         applied: 0,
//         viewed: 0,
//         accepted: 0,
//         rejected: 0,
//       })
//     }
//   }

//   const fetchUnreadMessages = async () => {
//     try {
//       const response = await fetch(`${API_URL}/messages/unread-count`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       if (!response.ok) throw new Error("Failed to fetch unread messages")
//       const data = await response.json()
//       setUnreadMessages(data.count || 0)
//     } catch (error) {
//       console.error("Failed to fetch unread messages:", error.message)
//     }
//   }


//   // Photo Upload Handler
//   const handlePhotoUpload = async (e) => {
//     const file = e.target.files[0]
//     if (!file) return

//     const formData = new FormData()
//     formData.append("photo", file)

//     try {
//       const response = await fetch(`${API_URL}/profile/institution/photo`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         body: formData,
//       })
//       if (!response.ok) throw new Error("Upload failed")

//       const data = await response.json()
//       const updatedPhoto = normalizeUrl(data.photoUrl || data.photo || data.url)
//       setProfile((prev) => ({ ...prev, photo: updatedPhoto }))

//       // Persist and broadcast the update so other tabs/components update live
//       try {
//         const cached = JSON.parse(localStorage.getItem("institutionProfile") || "{}")
//         const merged = { ...cached, photo: updatedPhoto }
//         localStorage.setItem("institutionProfile", JSON.stringify(merged))

//         const user = JSON.parse(localStorage.getItem("user") || "{}")
//         user.profilePhoto = updatedPhoto
//         localStorage.setItem("user", JSON.stringify(user))

//         window.dispatchEvent(new CustomEvent("institutionProfileUpdated", { detail: { photo: updatedPhoto } }))
//       } catch (error) {
//         console.error("Error persisting photo update:", error)
//       }
//     } catch (error) {
//       console.error("Photo upload failed:", error)
//       alert("Failed to upload photo")
//     }
//   }


//   const handleEditJob = (jobId) => {
//     navigate(`/institution/edit-job/${jobId}`)
//   }

//   const handleDeleteJob = async (jobId) => {
//     if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
//       return
//     }

//     try {
//       await fetch(`${API_URL}/jobs/${jobId}`, {
//         method: "DELETE",
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       alert("Job deleted successfully!")
//       fetchInstitutionJobs()
//     } catch (error) {
//       console.error("Failed to delete job:", error)
//       alert("Failed to delete job")
//     }
//   }

//   const handleLogout = () => {
//     logout()
//     navigate("/")
//   }

  
//   useEffect(() => {
//     const onAppLogout = () => {
//       window.location.href = "/"
//     }
//     window.addEventListener("app:logout", onAppLogout)

//     const handleProfileUpdate = () => {
//       fetchInstitutionProfile()
//     }

//     window.addEventListener("institutionProfileUpdated", handleProfileUpdate)

//     return () => {
//       window.removeEventListener("app:logout", onAppLogout)
//       window.removeEventListener("institutionProfileUpdated", handleProfileUpdate)
//     }
//   }, [])

//   return (
//     <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
//       <nav className="navbar">
//         <div className="container flex justify-between">
//           <Link to="/" className="navbar-brand" style={{ textDecoration: "none" }}>
//             <Logo />
//           </Link>
//           <button onClick={handleLogout} className="btn btn-secondary btn-sm">
//             <LogOut size={18} /> Logout
//           </button>
//         </div>
//       </nav>

//       <section style={{ padding: "2rem 0", background: "#f8f9fa", minHeight: "calc(100vh - 80px)" }}>
//         <div className="container">
//           <div className="grid" style={{ gridTemplateColumns: "250px 1fr", gap: "2rem" }}>
//             {/* Sidebar */}
//             <div>
//               {/* Institution Profile Card */}
//               <div className="card" style={{ marginBottom: "1.5rem", background: "white" }}>
//                 <div style={{ textAlign: "center", marginBottom: "1rem", position: "relative" }}>
//                   {profile?.photo ? (
//                     <img
//                       src={profile.photo}
//                       alt="Institution Logo"
//                       style={{
//                         width: "80px",
//                         height: "80px",
//                         borderRadius: "50%",
//                         objectFit: "cover",
//                         margin: "0 auto",
//                         border: "3px solid #1a5490",
//                       }}
//                     />
//                   ) : (
//                     <div
//                       style={{
//                         width: "80px",
//                         height: "80px",
//                         borderRadius: "50%",
//                         background: "#1a5490",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         margin: "0 auto",
//                         fontSize: "2.5rem",
//                         color: "white",
//                       }}
//                     >
//                       🏫
//                     </div>
//                   )}

//                   <label
//                     htmlFor="photoUpload"
//                     style={{
//                       position: "absolute",
//                       bottom: 0,
//                       right: "calc(50% - 40px)",
//                       background: "#1a5490",
//                       color: "white",
//                       borderRadius: "50%",
//                       padding: "0.3rem",
//                       cursor: "pointer",
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                     }}
//                     title="Upload new photo"
//                   >
//                     <Upload size={14} />
//                   </label>
//                   <input
//                     type="file"
//                     id="photoUpload"
//                     accept="image/*"
//                     style={{ display: "none" }}
//                     onChange={handlePhotoUpload}
//                   />
//                 </div>
//                 <h4 style={{ margin: "0.5rem 0", textAlign: "center" }}>
//                         fontSize: "2.5rem",
//                         color: "white",
//                       }}
//                     >
//                       🏫
//                     </div>
//                   )}

//                   {/* ✅ Added Upload Button */}
//                   <label
//                     htmlFor="photoUpload"
//                     style={{
//                       position: "absolute",
//                       bottom: 0,
//                       right: "calc(50% - 40px)",
//                       background: "#1a5490",
//                       color: "white",
//                       borderRadius: "50%",
//                       padding: "0.3rem",
//                       cursor: "pointer",
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                     }}
//                     title="Upload new photo"
//                   >
//                     <Upload size={14} />
//                   </label>
//                   <input
//                     type="file"
//                     id="photoUpload"
//                     accept="image/*"
//                     style={{ display: "none" }}
//                     onChange={handlePhotoUpload}
//                   />
//                 </div>
//                 <h4 style={{ margin: "0.5rem 0", textAlign: "center" }}>
//                   {profile?.institutionName || "Institution Name"}
//                 </h4>
//                 <p style={{ color: "#666", fontSize: "0.875rem", margin: "0", textAlign: "center" }}>Premium Member</p>
//                 <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
//                   <span
//                     style={{
//                       background: "#d4edda",
//                       color: "#155724",
//                       padding: "0.375rem 0.75rem",
//                       borderRadius: "9999px",
//                       fontSize: "0.75rem",
//                       fontWeight: "600",
//                     }}
//                   >
//                     ✓ Verified
//                   </span>
//                 </div>
//               </div>

//               {/* Navigation Menu */}
//               <div className="card" style={{ background: "white" }}>
//                 <h4 style={{ marginBottom: "1rem" }}>Dashboard</h4>
//                 <ul style={{ listStyle: "none" }}>
//                   <li style={{ marginBottom: "0.5rem" }}>
//                     <Link
//                       to="/institution/post-job"
//                       style={{
//                         background: "transparent",
//                         color: "#666",
//                         padding: "0.75rem 1rem",
//                         border: "none",
//                         borderRadius: "0.5rem",
//                         cursor: "pointer",
//                         width: "100%",
//                         textAlign: "left",
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "0.5rem",
//                         textDecoration: "none",
//                       }}
//                     >
//                       <Plus size={18} /> Post Job
//                     </Link>
//                   </li>
//                   <li style={{ marginBottom: "0.5rem" }}>
//                     <Link
//                       to="/institution/applications"
//                       style={{
//                         background: "transparent",
//                         color: "#666",
//                         padding: "0.75rem 1rem",
//                         border: "none",
//                         borderRadius: "0.5rem",
//                         cursor: "pointer",
//                         width: "100%",
//                         textAlign: "left",
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "0.5rem",
//                         textDecoration: "none",
//                       }}
//                     >
//                       <Users size={18} /> Applications
//                     </Link>
//                   </li>
//                   <li style={{ marginBottom: "0.5rem" }}>
//                     <Link
//                       to="/institution/interviews"
//                       style={{
//                         background: "transparent",
//                         padding: "0.75rem 1rem",
//                         border: "none",
//                         borderRadius: "0.5rem",
//                         cursor: "pointer",
//                         width: "100%",
//                         textAlign: "left",
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "0.5rem",
//                         textDecoration: "none",
//                         fontWeight: stats.interviewed > 0 ? "600" : "normal",
//                         color: stats.interviewed > 0 ? "#9b59b6" : "#666"
//                       }}
//                       title={`${stats.interviewed} Interviews Scheduled`}
//                     >
//                       <Video size={18} /> Interviews {stats.interviewed > 0 ? `(${stats.interviewed})` : ""}
//                     </Link>
//                   </li>
//                   <li style={{ marginBottom: "0.5rem" }}>
//                     <Link
//                       to="/institution/messages"
//                       style={{
//                         background: "transparent",
//                         color: unreadMessages > 0 ? "#e74c3c" : "#666",
//                         padding: "0.75rem 1rem",
//                         border: "none",
//                         borderRadius: "0.5rem",
//                         cursor: "pointer",
//                         width: "100%",
//                         textAlign: "left",
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "0.5rem",
//                         textDecoration: "none",
//                         fontWeight: unreadMessages > 0 ? "600" : "normal",
//                       }}
//                     >
//                       💬 Messages{unreadMessages > 0 ? ` (${unreadMessages})` : ""}
//                     </Link>
//                   </li>
//                   <li style={{ marginBottom: "0.5rem" }}>
//                     <Link
//                       to="/institution/search-teachers"
//                       style={{
//                         background: "transparent",
//                         color: "#666",
//                         padding: "0.75rem 1rem",
//                         border: "none",
//                         borderRadius: "0.5rem",
//                         cursor: "pointer",
//                         width: "100%",
//                         textAlign: "left",
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "0.5rem",
//                         textDecoration: "none",
//                       }}
//                     >
//                       🔍 Search Teachers
//                     </Link>
//                   </li>
//                   <li style={{ marginBottom: "0.5rem" }}>
//                     <Link
//                       to="/institution/teams"
//                       style={{
//                         background: "transparent",
//                         color: "#666",
//                         padding: "0.75rem 1rem",
//                         border: "none",
//                         borderRadius: "0.5rem",
//                         cursor: "pointer",
//                         width: "100%",
//                         textAlign: "left",
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "0.5rem",
//                         textDecoration: "none",
//                       }}
//                     >
//                       👥 Teams
//                     </Link>
//                   </li>
//                   <li style={{ marginBottom: "0.5rem" }}>
//                     <Link
//                       to="/institution/billing"
//                       style={{
//                         background: "transparent",
//                         color: "#666",
//                         padding: "0.75rem 1rem",
//                         border: "none",
//                         borderRadius: "0.5rem",
//                         cursor: "pointer",
//                         width: "100%",
//                         textAlign: "left",
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "0.5rem",
//                         textDecoration: "none",
//                       }}
//                     >
//                       💳 Billing
//                     </Link>
//                   </li>
//                   <li style={{ marginBottom: "0.5rem" }}>
//                     <Link
//                       to="/institution/settings"
//                       style={{
//                         background: "transparent",
//                         color: "#666",
//                         padding: "0.75rem 1rem",
//                         border: "none",
//                         borderRadius: "0.5rem",
//                         cursor: "pointer",
//                         width: "100%",
//                         textAlign: "left",
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "0.5rem",
//                         textDecoration: "none",
//                       }}
//                     >
//                       ⚙️ Settings
//                     </Link>
//                   </li>
//                 </ul>
//               </div>
//             </div>

//             {/* Main Content */}
//             <div>
//               {/* Welcome Message */}
//               <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "white", borderRadius: "0.5rem", border: "1px solid #e0e0e0" }}>
//                 <h2 style={{ marginBottom: "0.5rem" }}>
//                   Welcome back, {profile?.institutionName || 'Institution'}! 👋
//                 </h2>
//                 <p style={{ color: "#666", fontSize: "0.9rem", margin: "0" }}>
//                   Ready to find great teachers? You have {jobs.length} active job postings and growing applications coming in.
//                 </p>
//               </div>

//               {/* Stats Cards */}
//               <div
//                 className="grid"
//                 style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}
//               >
//                 <div className="card" style={{ textAlign: "center", background: "white" }}>
//                   <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Active Jobs</p>
//                   <h2 style={{ margin: "0", color: "#1a5490" }}>{jobs.length}</h2>
//                 </div>
//                 <div className="card" style={{ textAlign: "center", background: "white" }}>
//                   <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Applied</p>
//                   <h2 style={{ margin: "0", color: "#2ecc71" }}>{stats.applied}</h2>
//                 </div>
//                 <div className="card" style={{ textAlign: "center", background: "white" }}>
//                   <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Viewed</p>
//                   <h2 style={{ margin: "0", color: "#f39c12" }}>{stats.viewed}</h2>
//                 </div>
//                 <div className="card" style={{ textAlign: "center", background: "white" }}>
//                   <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Shortlisted</p>
//                   <h2 style={{ margin: "0", color: "#3498db" }}>{stats.shortlisted}</h2>
//                 </div>
//                 <div className="card" style={{ textAlign: "center", background: "white" }}>
//                   <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Interview Scheduled</p>
//                   <h2 style={{ margin: "0", color: "#9b59b6" }}>{stats.interviewed}</h2>
//                 </div>
//                 <div className="card" style={{ textAlign: "center", background: "white" }}>
//                   <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Accepted</p>
//                   <h2 style={{ margin: "0", color: "#27ae60" }}>{stats.accepted}</h2>
//                 </div>
//                 <div className="card" style={{ textAlign: "center", background: "white" }}>
//                   <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Rejected</p>
//                   <h2 style={{ margin: "0", color: "#e74c3c" }}>{stats.rejected}</h2>
//                 </div>
//               </div>

//               {/* Scheduled Interviews Section */}
//               <div style={{ marginBottom: "2rem" }}>
//                 <h3
//                   style={{
//                     marginBottom: "1rem",
//                     display: "flex",
//                     alignItems: "center",
//                     gap: "0.5rem",
//                     color: "#1a5490",
//                     fontWeight: "bold",
//                     fontSize: "1.5rem",
//                   }}
//                 >
//                   <Video size={24} /> Scheduled Interviews
//                 </h3>
//                 {loadingInterviews ? (
//                   <div>Loading interviews...</div>
//                 ) : errorInterviews ? (
//                   <div style={{ color: "red" }}>{errorInterviews}</div>
//                 ) : (
//                   <InterviewList interviews={interviews} onJoinLiveInterview={joinLiveInterview} />
//                 )}
//               </div>

//               {/* Quick Actions */}
//               <div style={{ marginBottom: "2rem" }}>
//                 <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
//                   <TrendingUp size={20} /> Quick Actions
//                 </h3>
//                 <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
//                   <Link
//                     to="/institution/post-job"
//                     style={{
//                       background: "#1a5490",
//                       color: "white",
//                       padding: "1rem",
//                       borderRadius: "0.5rem",
//                       textAlign: "center",
//                       textDecoration: "none",
//                       cursor: "pointer",
//                       transition: "all 0.2s",
//                     }}
//                     onMouseEnter={(e) => (e.target.style.background = "#0f3a63")}
//                     onMouseLeave={(e) => (e.target.style.background = "#1a5490")}
//                   >
//                     Post a New Job
//                   </Link>
//                   <Link
//                     to="/institution/search-teachers"
//                     style={{
//                       background: "#2ecc71",
//                       color: "white",
//                       padding: "1rem",
//                       borderRadius: "0.5rem",
//                       textAlign: "center",
//                       textDecoration: "none",
//                       cursor: "pointer",
//                       transition: "all 0.2s",
//                     }}
//                     onMouseEnter={(e) => (e.target.style.background = "#27ae60")}
//                     onMouseLeave={(e) => (e.target.style.background = "#2ecc71")}
//                   >
//                     Search Teachers
//                   </Link>
//                   <Link
//                     to="/institution/teams"
//                     style={{
//                       background: "#3498db",
//                       color: "white",
//                       padding: "1rem",
//                       borderRadius: "0.5rem",
//                       textAlign: "center",
//                       textDecoration: "none",
//                       cursor: "pointer",
//                       transition: "all 0.2s",
//                     }}
//                     onMouseEnter={(e) => (e.target.style.background = "#2980b9")}
//                     onMouseLeave={(e) => (e.target.style.background = "#3498db")}
//                   >
//                     Manage Teams
//                   </Link>
//                 </div>
//               </div>

//               {/* My Job Postings */}
//               <div>
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     marginBottom: "2rem",
//                   }}
//                 >
//                   <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//                     <BarChart3 size={24} /> My Job Postings
//                   </h2>
//                   <Link to="/institution/post-job" className="btn btn-primary" style={{ fontSize: "0.875rem" }}>
//                     + Post New Job
//                   </Link>
//                 </div>
//                 <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
//                   {loading ? (
//                     <div style={{ gridColumn: "span 2", textAlign: "center", padding: "2rem" }}>
//                       Loading jobs...
//                     </div>
//                   ) : jobs.length === 0 ? (
//                     <div style={{ gridColumn: "span 2", textAlign: "center", padding: "2rem" }}>
//                       No jobs posted yet. <Link to="/institution/post-job">Post your first job</Link>
//                     </div>
//                   ) : (
//                     jobs.map((job) => (
//                       <div key={job.id} className="card" style={{ background: "white" }}>
//                         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
//                           <div>
//                             <h4 style={{ margin: "0 0 0.5rem" }}>{job.title}</h4>
//                             <p style={{ color: "#666", fontSize: "0.875rem", margin: "0" }}>
//                               {job.applications} applications received
//                             </p>
//                           </div>
//                           <span
//                             style={{
//                               background: "#2ecc71",
//                               color: "white",
//                               padding: "0.375rem 0.75rem",
//                               borderRadius: "9999px",
//                               fontSize: "0.75rem",
//                               fontWeight: "bold",
//                               height: "fit-content",
//                             }}
//                           >
//                             {job.status}
//                           </span>
//                         </div>
//                         <div
//                           style={{
//                             display: "grid",
//                             gridTemplateColumns: "1fr 1fr",
//                             gap: "0.5rem",
//                             marginBottom: "1rem",
//                           }}
//                         >
//                           <div>
//                             <p style={{ color: "#999", fontSize: "0.75rem", margin: "0" }}>POSTED</p>
//                             <p style={{ color: "#333", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>{job.posted}</p>
//                           </div>
//                           <div>
//                             <p style={{ color: "#999", fontSize: "0.75rem", margin: "0" }}>DEADLINE</p>
//                             <p style={{ color: "#333", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>{job.deadline || "No deadline"}</p>
//                           </div>
//                         </div>
//                         <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
//                           <Link
//                             to={`/institution/applications?job=${job.id}`}
//                             className="btn btn-primary"
//                             style={{ fontSize: "0.875rem", flex: 1 }}
//                           >
//                             View Applications
//                           </Link>
//                           <button
//                             onClick={() => handleEditJob(job.id)}
//                             className="btn btn-secondary"
//                             style={{ fontSize: "0.875rem", padding: "0.5rem" }}
//                             title="Edit Job"
//                           >
//                             <Edit size={16} />
//                           </button>
//                           <button
//                             onClick={() => handleDeleteJob(job.id)}
//                             className="btn btn-danger"
//                             style={{ fontSize: "0.875rem", padding: "0.5rem" }}
//                             title="Delete Job"
//                           >
//                             <Trash2 size={16} />
//                           </button>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   )
// }

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { LogOut, Plus, Users, TrendingUp, BarChart3, Upload, Edit, Trash2, Video } from "lucide-react"
import { logout } from "../lib/auth"
import Logo from "../components/Logo"
import InterviewList from "../components/InterviewList"

import { API_URL, BASE_URL } from "../config/api"

// Helper to ensure URLs returned from the API are absolute so the browser can load them
const normalizeUrl = (url) => {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith("/")) return `${BASE_URL}${url}`
  return `${BASE_URL}/${url}`
}

export default function InstitutionDashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    shortlisted: 0,
    underReview: 0,
    interviewed: 0,
    hired: 0,
  })

  const [profile, setProfile] = useState(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [interviews, setInterviews] = useState([])
  const [loadingInterviews, setLoadingInterviews] = useState(true)
  const [errorInterviews, setErrorInterviews] = useState(null)

  const navigate = useNavigate()
  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    const user = localStorage.getItem("user")
    if (!token || !user) {
      navigate("/login-institution")
      return
    }

    fetchInstitutionProfile()
    fetchInstitutionJobs()
    fetchInstitutionStats()
    fetchUnreadMessages()
    fetchInterviews()
  }, [navigate])

  const fetchInstitutionJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/jobs/institution/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch jobs")
      const jobsData = await response.json()
      setJobs(jobsData)
    } catch (error) {
      console.error("Failed to fetch institution jobs:", error.message)
      setJobs([]) // Ensure jobs is an array
    } finally {
      setLoading(false)
    }
  }

  const fetchInterviews = async () => {
    try {
      setLoadingInterviews(true)
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const institutionId = user.institutionId
      if (!institutionId) throw new Error("Institution ID missing")
      const response = await fetch(`${API_URL}/interviews?institutionId=${institutionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch interviews")
      const data = await response.json()
      setInterviews(data)
      setErrorInterviews(null)
    } catch (error) {
      console.error("Failed to fetch interviews:", error.message)
      setInterviewsError("Failed to load interviews")
      setInterviews([])
    } finally {
      setLoadingInterviews(false)
    }
  }

  const fetchInstitutionProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/profile/institution`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch profile")
      const prof = await response.json()
      if (prof.photo) prof.photo = normalizeUrl(prof.photo)
      setProfile(prof)
    } catch (error) {
      console.error("Failed to fetch institution profile:", error.message)
      setProfile(null) // Ensure profile is null if fetch fails
    }
  }

  const fetchInstitutionStats = async () => {
    try {
      const response = await fetch(`${API_URL}/applications/stats/institution`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch stats")
      const statsData = await response.json()
      setStats(statsData)
    } catch (error) {
      console.error("Failed to fetch institution stats:", error.message)
      setStats({
        shortlisted: 0,
        underReview: 0,
        interviewed: 0,
        hired: 0,
        accepted: 0,
        rejected: 0,
      })
    }
  }

  const fetchUnreadMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch unread messages")
      const data = await response.json()
      setUnreadMessages(data.count || 0)
    } catch (error) {
      console.error("Failed to fetch unread messages:", error.message)
    }
  }

  // ✅ Added: Photo Upload Handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("photo", file)

    try {
      const response = await fetch(`${API_URL}/profile/institution/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      const updatedPhoto = normalizeUrl(data.photoUrl || data.photo || data.url)
      setProfile((prev) => ({ ...prev, photo: updatedPhoto }))

      // Persist and broadcast the update so other tabs/components update live
      try {
        const cached = JSON.parse(localStorage.getItem("institutionProfile") || "{}")
        const merged = { ...cached, photo: updatedPhoto }
        localStorage.setItem("institutionProfile", JSON.stringify(merged))

        // Also update the user object in localStorage
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        user.profilePhoto = updatedPhoto
        localStorage.setItem("user", JSON.stringify(user))

        window.dispatchEvent(new CustomEvent("institutionProfileUpdated", { detail: { photo: updatedPhoto } }))
      } catch (error) {
        console.error("Error persisting photo update:", error)
      }
    } catch (error) {
      console.error("Photo upload failed:", error)
      alert("Failed to upload photo")
    }
  }

  // Handle edit job
  const handleEditJob = (jobId) => {
    navigate(`/institution/edit-job/${jobId}`)
  }

  // Handle delete job
  const handleDeleteJob = async (jobId) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return
    }

    try {
      await fetch(`${API_URL}/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      alert("Job deleted successfully!")
      fetchInstitutionJobs() // Refresh the jobs list
    } catch (error) {
      console.error("Failed to delete job:", error)
      alert("Failed to delete job")
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  // React to programmatic logout event (from other tabs/components)
  useEffect(() => {
    const onAppLogout = () => {
      // page is simple static; force a reload to ensure UI resets
      window.location.href = "/"
    }
    window.addEventListener("app:logout", onAppLogout)

    // Listen for profile updates (e.g., photo changes)
    const handleProfileUpdate = () => {
      fetchInstitutionProfile()
    }

    window.addEventListener("institutionProfileUpdated", handleProfileUpdate)

    return () => {
      window.removeEventListener("app:logout", onAppLogout)
      window.removeEventListener("institutionProfileUpdated", handleProfileUpdate)
    }
  }, [])

  // Join Live Interview
  const joinLiveInterview = (roomId) => {
    if (!roomId) {
      alert("Invalid live interview room.")
      return
    }
    window.open(`${BASE_URL}/live-interview/${roomId}`, "_blank")
  }

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <section style={{ padding: "2rem 0", background: "#f8f9fa", minHeight: "calc(100vh - 80px)" }}>
        <div className="container">
          <div className="grid" style={{ gridTemplateColumns: "250px 1fr", gap: "2rem" }}>
            {/* Sidebar */}
            <div>
              {/* Institution Profile Card */}
              <div className="card" style={{ marginBottom: "1.5rem", background: "white" }}>
                <div style={{ textAlign: "center", marginBottom: "1rem", position: "relative" }}>
                  {profile?.photo ? (
                    <img
                      src={profile.photo}
                      alt="Institution Logo"
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        margin: "0 auto",
                        border: "3px solid #1a5490",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "#1a5490",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        fontSize: "2.5rem",
                        color: "white",
                      }}
                    >
                      🏫
                    </div>
                  )}

                  {/* ✅ Added Upload Button */}
                  <label
                    htmlFor="photoUpload"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: "calc(50% - 40px)",
                      background: "#1a5490",
                      color: "white",
                      borderRadius: "50%",
                      padding: "0.3rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Upload new photo"
                  >
                    <Upload size={14} />
                  </label>
                  <input
                    type="file"
                    id="photoUpload"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePhotoUpload}
                  />
                </div>
                <h4 style={{ margin: "0.5rem 0", textAlign: "center" }}>
                  {profile?.institutionName || "Institution Name"}
                </h4>
                <p style={{ color: "#666", fontSize: "0.875rem", margin: "0", textAlign: "center" }}>Premium Member</p>
                <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
                  <span
                    style={{
                      background: "#d4edda",
                      color: "#155724",
                      padding: "0.375rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                    }}
                  >
                    ✓ Verified
                  </span>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="card" style={{ background: "white" }}>
                <h4 style={{ marginBottom: "1rem" }}>Dashboard</h4>
                <ul style={{ listStyle: "none" }}>
                  <li style={{ marginBottom: "0.5rem" }}>
                    <Link
                      to="/institution/post-job"
                      style={{
                        background: "transparent",
                        color: "#666",
                        padding: "0.75rem 1rem",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textDecoration: "none",
                      }}
                    >
                      <Plus size={18} /> Post Job
                    </Link>
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    <Link
                      to="/institution/applications"
                      style={{
                        background: "transparent",
                        color: "#666",
                        padding: "0.75rem 1rem",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textDecoration: "none",
                      }}
                    >
                      <Users size={18} /> Applications
                    </Link>
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    <Link
                      to="/institution/interviews"
                      style={{
                        background: "transparent",
                        padding: "0.75rem 1rem",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textDecoration: "none",
                        fontWeight: stats.interviewed > 0 ? "600" : "normal",
                        color: stats.interviewed > 0 ? "#9b59b6" : "#666"
                      }}
                      title={`${stats.interviewed} Interviews Scheduled`}
                    >
                      <Video size={18} /> Interviews {stats.interviewed > 0 ? `(${stats.interviewed})` : ""}
                    </Link>
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    <Link
                      to="/institution/messages"
                      style={{
                        background: "transparent",
                        color: unreadMessages > 0 ? "#e74c3c" : "#666",
                        padding: "0.75rem 1rem",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textDecoration: "none",
                        fontWeight: unreadMessages > 0 ? "600" : "normal",
                      }}
                    >
                      💬 Messages{unreadMessages > 0 ? ` (${unreadMessages})` : ""}
                    </Link>
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    <Link
                      to="/institution/search-teachers"
                      style={{
                        background: "transparent",
                        color: "#666",
                        padding: "0.75rem 1rem",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textDecoration: "none",
                      }}
                    >
                      🔍 Search Teachers
                    </Link>
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    <Link
                      to="/institution/teams"
                      style={{
                        background: "transparent",
                        color: "#666",
                        padding: "0.75rem 1rem",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textDecoration: "none",
                      }}
                    >
                      👥 Teams
                    </Link>
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    <Link
                      to="/institution/billing"
                      style={{
                        background: "transparent",
                        color: "#666",
                        padding: "0.75rem 1rem",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textDecoration: "none",
                      }}
                    >
                      💳 Billing
                    </Link>
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    <Link
                      to="/institution/settings"
                      style={{
                        background: "transparent",
                        color: "#666",
                        padding: "0.75rem 1rem",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textDecoration: "none",
                      }}
                    >
                      ⚙️ Settings
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Main Content */}
            <div>
              {/* Welcome Message */}
              <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "white", borderRadius: "0.5rem", border: "1px solid #e0e0e0" }}>
                <h2 style={{ marginBottom: "0.5rem" }}>
                  Welcome back, {profile?.institutionName || 'Institution'}! 👋
                </h2>
                <p style={{ color: "#666", fontSize: "0.9rem", margin: "0" }}>
                  Ready to find great teachers? You have {jobs.length} active job postings and growing applications coming in.
                </p>
              </div>

              {/* Stats Cards */}
              <div
                className="grid"
                style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}
              >
                <div className="card" style={{ textAlign: "center", background: "white" }}>
                  <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Active Jobs</p>
                  <h2 style={{ margin: "0", color: "#1a5490" }}>{jobs.length}</h2>
                </div>
                <div className="card" style={{ textAlign: "center", background: "white" }}>
                  <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Applied</p>
                  <h2 style={{ margin: "0", color: "#2ecc71" }}>{stats.applied}</h2>
                </div>
                <div className="card" style={{ textAlign: "center", background: "white" }}>
                  <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Viewed</p>
                  <h2 style={{ margin: "0", color: "#f39c12" }}>{stats.viewed}</h2>
                </div>
                <div className="card" style={{ textAlign: "center", background: "white" }}>
                  <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Shortlisted</p>
                  <h2 style={{ margin: "0", color: "#3498db" }}>{stats.shortlisted}</h2>
                </div>
                <div className="card" style={{ textAlign: "center", background: "white" }}>
                  <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Interview Scheduled</p>
                  <h2 style={{ margin: "0", color: "#9b59b6" }}>{stats.interviewed}</h2>
                </div>
                <div className="card" style={{ textAlign: "center", background: "white" }}>
                  <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Accepted</p>
                  <h2 style={{ margin: "0", color: "#27ae60" }}>{stats.accepted}</h2>
                </div>
                <div className="card" style={{ textAlign: "center", background: "white" }}>
                  <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Rejected</p>
                  <h2 style={{ margin: "0", color: "#e74c3c" }}>{stats.rejected}</h2>
                </div>
              </div>

              {/* Scheduled Interviews Section */}
              <div style={{ marginBottom: "2rem" }}>
                <h3
                  style={{
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#1a5490",
                    fontWeight: "bold",
                    fontSize: "1.5rem",
                  }}
                >
                  <Video size={24} /> Scheduled Interviews
                </h3>
                {loadingInterviews ? (
                  <div>Loading interviews...</div>
                ) : errorInterviews ? (
                  <div style={{ color: "red" }}>{errorInterviews}</div>
                ) : (
                  <InterviewList interviews={interviews} onJoinLiveInterview={joinLiveInterview} />
                )}
              </div>

              {/* Quick Actions */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <TrendingUp size={20} /> Quick Actions
                </h3>
                <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                  <Link
                    to="/institution/post-job"
                    style={{
                      background: "#1a5490",
                      color: "white",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      textAlign: "center",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.background = "#0f3a63")}
                    onMouseLeave={(e) => (e.target.style.background = "#1a5490")}
                  >
                    Post a New Job
                  </Link>
                  <Link
                    to="/institution/search-teachers"
                    style={{
                      background: "#2ecc71",
                      color: "white",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      textAlign: "center",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.background = "#27ae60")}
                    onMouseLeave={(e) => (e.target.style.background = "#2ecc71")}
                  >
                    Search Teachers
                  </Link>
                  <Link
                    to="/institution/teams"
                    style={{
                      background: "#3498db",
                      color: "white",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      textAlign: "center",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.background = "#2980b9")}
                    onMouseLeave={(e) => (e.target.style.background = "#3498db")}
                  >
                    Manage Teams
                  </Link>
                </div>
              </div>

              {/* My Job Postings */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                  }}
                >
                  <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <BarChart3 size={24} /> My Job Postings
                  </h2>
                  <Link to="/institution/post-job" className="btn btn-primary" style={{ fontSize: "0.875rem" }}>
                    + Post New Job
                  </Link>
                </div>
                <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
                  {loading ? (
                    <div style={{ gridColumn: "span 2", textAlign: "center", padding: "2rem" }}>
                      Loading jobs...
                    </div>
                  ) : jobs.length === 0 ? (
                    <div style={{ gridColumn: "span 2", textAlign: "center", padding: "2rem" }}>
                      No jobs posted yet. <Link to="/institution/post-job">Post your first job</Link>
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <div key={job.id} className="card" style={{ background: "white" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                          <div>
                            <h4 style={{ margin: "0 0 0.5rem" }}>{job.title}</h4>
                            <p style={{ color: "#666", fontSize: "0.875rem", margin: "0" }}>
                              {job.applications} applications received
                            </p>
                          </div>
                          <span
                            style={{
                              background: "#2ecc71",
                              color: "white",
                              padding: "0.375rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              height: "fit-content",
                            }}
                          >
                            {job.status}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.5rem",
                            marginBottom: "1rem",
                          }}
                        >
                          <div>
                            <p style={{ color: "#999", fontSize: "0.75rem", margin: "0" }}>POSTED</p>
                            <p style={{ color: "#333", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>{job.posted}</p>
                          </div>
                          <div>
                            <p style={{ color: "#999", fontSize: "0.75rem", margin: "0" }}>DEADLINE</p>
                            <p style={{ color: "#333", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>{job.deadline || "No deadline"}</p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                          <Link
                            to={`/institution/applications?job=${job.id}`}
                            className="btn btn-primary"
                            style={{ fontSize: "0.875rem", flex: 1 }}
                          >
                            View Applications
                          </Link>
                          <button
                            onClick={() => handleEditJob(job.id)}
                            className="btn btn-secondary"
                            style={{ fontSize: "0.875rem", padding: "0.5rem" }}
                            title="Edit Job"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="btn btn-danger"
                            style={{ fontSize: "0.875rem", padding: "0.5rem" }}
                            title="Delete Job"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
