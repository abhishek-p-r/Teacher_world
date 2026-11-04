import { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

// Small helper to perform a clean logout across the app
export function logout(navigate) {
  try {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("user")
    localStorage.removeItem("teacherProfile")
    localStorage.removeItem("institutionProfile")
  } catch (e) {
    // ignore
  }

  // Prefer SPA navigation if a navigate function is provided, otherwise do a replace
  if (typeof navigate === "function") {
    try {
      navigate("/")
    } catch (e) {
      window.location.href = "/"
    }
  } else {
    // notify other app components/tabs
    try {
      window.dispatchEvent(new Event("app:logout"))
    } catch (e) {}
    // remove refresh token if present
    try { localStorage.removeItem("refreshToken") } catch (e) {}
    window.location.href = "/"
  }
}

export function getAuthToken() {
  try {
    const t = localStorage.getItem("accessToken")
    if (!t) return null
    const s = String(t).trim()
    if (s === "undefined" || s === "null" || s.length === 0) return null
    return s
  } catch (e) {
    return null
  }
}

export async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return null

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    if (!res.ok) return null
    const data = await res.json()
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken)
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
      return data.accessToken
    }
    return null
  } catch (e) {
    return null
  }
}

// React hook to provide user authentication info from localStorage
export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
  }, []);

  return { user };
}
