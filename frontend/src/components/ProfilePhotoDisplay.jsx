"use client"

import { useMemo } from "react"
import { BASE_URL } from "../config/api"

export default function ProfilePhotoDisplay({ photoUrl, name = "Teacher", size = 100, border = true }) {
  const normalizeUrl = (url) => {
    if (!url) return null
    if (/^https?:\/\//i.test(url)) return url
    if (url.startsWith("/")) return `${BASE_URL}${url}`
    return `${BASE_URL}/${url}`
  }

  const normalizedUrl = useMemo(() => normalizeUrl(photoUrl), [photoUrl])
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        border: border ? "4px solid #1a5490" : "none",
        background: "#e0e0e0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {normalizedUrl ? (
        <img
          src={normalizedUrl || "/placeholder.svg"}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onError={(e) => {
            e.target.style.display = "none"
            e.target.nextSibling.style.display = "flex"
          }}
        />
      ) : null}
      <div
        style={{
          display: normalizedUrl ? "none" : "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#e0e0e0",
          fontSize: size > 60 ? "2rem" : "1rem",
          fontWeight: "600",
          color: "#666",
        }}
      >
        {normalizedUrl ? "" : initials || "👤"}
      </div>
    </div>
  )
}
