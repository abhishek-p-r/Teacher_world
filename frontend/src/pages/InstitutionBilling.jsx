"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Check } from "lucide-react"
import axios from "axios"
import Logo from "../components/Logo"

import { API_URL } from "../config/api"

export default function InstitutionBilling() {
  const [subscription, setSubscription] = useState({
    plan: "Professional",
    status: "active",
    startDate: "2025-11-01",
    renewalDate: "2025-12-01",
    amount: "0",
    currency: "INR",
  })
  const [plans] = useState([
    {
      name: "Starter",
      price: "0",
      period: "month",
      features: ["Up to 5 job postings", "Basic analytics", "Email support", "5 team members"],
    },
    {
      name: "Professional",
      price: "0",
      period: "month",
      features: [
        "Unlimited job postings",
        "Advanced analytics",
        "Priority support",
        "Unlimited team members",
        "Demo class hosting",
        "AI recommendations",
      ],
      current: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "month",
      features: [
        "Everything in Professional",
        "Custom integrations",
        "Dedicated account manager",
        "Advanced reporting",
        "API access",
      ],
    },
  ])
  const [token] = useState(localStorage.getItem("accessToken"))
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchBillingInfo()
  }, [])

  const fetchBillingInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/institution/billing`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSubscription(response.data)
    } catch (error) {
      console.error("Failed to fetch billing info:", error)
    }
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

  <section style={{ padding: "2rem 0", background: "var(--gray-50)", minHeight: "100vh" }}>
        <div className="container">
          <h1 style={{ marginBottom: "2rem" }}>Billing & Subscription</h1>

          {/* Current Plan */}
          <div className="card" style={{ marginBottom: "2rem", borderLeft: "4px solid #27ae60" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <p style={{ color: "#666", fontSize: "0.875rem" }}>Current Plan</p>
                <h2 style={{ margin: "0.5rem 0" }}>{subscription.plan}</h2>
                <p style={{ color: "#27ae60", fontWeight: "600" }}>Active</p>
              </div>
              <div>
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ color: "#666", fontSize: "0.875rem" }}>Next Renewal</p>
                  <p style={{ fontSize: "1.125rem", margin: "0.5rem 0" }}>
                    {new Date(subscription.renewalDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: "#666", fontSize: "0.875rem" }}>Monthly Cost</p>
                  <p style={{ fontSize: "1.125rem", margin: "0.5rem 0" }}>
                    ₹{subscription.amount}/{subscription.currency}
                  </p>
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid #e0e0e0",
                display: "flex",
                gap: "1rem",
              }}
            >
              <button className="btn btn-secondary">Manage Subscription</button>
              <button className="btn btn-secondary">Download Invoice</button>
            </div>
          </div>

          {/* Available Plans */}
          <h2 style={{ marginBottom: "1.5rem" }}>Available Plans</h2>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="card"
                style={{
                  border: plan.current ? "2px solid #1a5490" : "1px solid #e0e0e0",
                  position: "relative",
                }}
              >
                {plan.current && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      right: "20px",
                      background: "#1a5490",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                    }}
                  >
                    Current Plan
                  </div>
                )}
                <h3 style={{ marginBottom: "0.5rem" }}>{plan.name}</h3>
                <p style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "0.5rem 0 1rem 0" }}>
                  {plan.price === "Custom" ? plan.price : `₹${plan.price}`}
                  <span style={{ fontSize: "0.875rem", color: "#666", fontWeight: "normal" }}>/{plan.period}</span>
                </p>
                <ul style={{ listStyle: "none", paddingLeft: 0, marginBottom: "1.5rem" }}>
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.75rem",
                        color: "#666",
                        fontSize: "0.875rem",
                      }}
                    >
                      <Check size={16} style={{ color: "#27ae60" }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={plan.current ? "btn btn-secondary" : "btn btn-primary"} style={{ width: "100%" }}>
                  {plan.current ? "Current Plan" : "Upgrade Now"}
                </button>
              </div>
            ))}
          </div>

          {/* Billing History */}
          <div className="card" style={{ marginTop: "2rem" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Billing History</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ textAlign: "left", padding: "1rem" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "1rem" }}>Plan</th>
                  <th style={{ textAlign: "left", padding: "1rem" }}>Amount</th>
                  <th style={{ textAlign: "left", padding: "1rem" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "1rem" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "1rem" }}>Nov 1, 2025</td>
                  <td style={{ padding: "1rem" }}>Professional</td>
                  <td style={{ padding: "1rem" }}>₹0</td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        background: "#27ae60",
                        color: "white",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      Paid
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <button style={{ background: "none", border: "none", color: "#1a5490", cursor: "pointer" }}>
                      Download
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
