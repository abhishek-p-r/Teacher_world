import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
import { API_URL as BACKEND_API_URL } from "../config/api";

// Simplified Karnataka polygon (lat/lng)
// NOTE: This is intentionally simplified — keep or replace with a more accurate polygon if needed.
const KARNATAKA_POLYGON = [
  { lat: 18.6779, lng: 74.3069 },
  { lat: 18.7628, lng: 74.4064 },
  { lat: 19.5207, lng: 75.4235 },
  { lat: 18.9507, lng: 76.0533 },
  { lat: 17.5238, lng: 77.5164 },
  { lat: 15.7835, lng: 77.8684 },
  { lat: 14.1717, lng: 77.65 },
  { lat: 13.0141, lng: 74.7964 },
  { lat: 12.1457, lng: 74.9048 },
  { lat: 11.9236, lng: 74.856 },
  { lat: 11.1271, lng: 75.8818 },
  { lat: 12.2271, lng: 77.9523 },
  { lat: 12.8333, lng: 78.2056 },
  { lat: 13.9, lng: 78.05 },
  { lat: 15.3173, lng: 75.7139 },
];

// Load Google Maps JS once and call onLoad callback
function loadGoogleMapsScript(apiKey, onLoad) {
  if (!apiKey) {
    console.error("Google Maps API key missing");
    return;
  }

  // If already loaded
  if (window.google && window.google.maps) {
    onLoad();
    return;
  }

  // If a script with maps.googleapis.com already exists, attach callback or wait
  const existing = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existing) {
    // If Google isn't ready yet, attach temporary callback that will be called when script's callback fires.
    // We use a global queue to avoid overwriting other consumers.
    window.__gmapsOnLoadQueue = window.__gmapsOnLoadQueue || [];
    window.__gmapsOnLoadQueue.push(onLoad);
    return;
  }

  // Create script with a callback that drains our queue
  window.__gmapsOnLoadQueue = [onLoad];
  const cbName = "__initGoogleMapsCallback";
  window[cbName] = function () {
    try {
      (window.__gmapsOnLoadQueue || []).forEach((fn) => {
        try { fn(); } catch (e) { console.error(e); }
      });
    } finally {
      // cleanup
      window.__gmapsOnLoadQueue = [];
      try { delete window[cbName]; } catch { /* ignore */ }
    }
  };

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${cbName}&v=weekly`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    console.error("Failed to load Google Maps script");
    // still attempt to call queued callbacks so consumers can handle missing maps
    (window.__gmapsOnLoadQueue || []).forEach((fn) => {
      try { fn(new Error("Google Maps failed to load")); } catch (e) { console.error(e); }
    });
    window.__gmapsOnLoadQueue = [];
  };
  document.head.appendChild(script);
}

// Ray-casting algorithm for point-in-polygon
// point: { lat, lng }, polygon: [{lat,lng}, ...]
// This implementation treats x as longitude and y as latitude (standard cartesian for maps)
function isPointInPolygon(point, polygon) {
  if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;
  const x = point.lng;
  const y = point.lat;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect =
      ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// More permissive Karnataka PIN regex: 6 digits, starting with 56 or 57 (common Karnataka prefixes).
// Adjust if you want a narrower set.
const KARNATAKA_PIN_REGEX = /^5[6-7]\d{4}$/;

export default function InstitutionMapView() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]); // markers (institution markers)
  const geocoderRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  const pinMarkerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchMode, setSearchMode] = useState("pin"); // 'pin' or 'institution'
  const [searchInput, setSearchInput] = useState("");
  const [institutions, setInstitutions] = useState([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState([]);
  const [autocompleteResults, setAutocompleteResults] = useState([]);

  // Initialize map & load script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError("Google Maps API key not configured");
      setLoading(false);
      return;
    }

    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY, () => {
      initializeMap();
    });

    // cleanup on unmount
    return () => {
      // remove all markers from map
      markersRef.current.forEach((m) => {
        try { m.setMap(null); } catch {}
      });
      markersRef.current = [];

      if (userLocationMarkerRef.current) {
        try { userLocationMarkerRef.current.setMap(null); } catch {}
        userLocationMarkerRef.current = null;
      }
      if (pinMarkerRef.current) {
        try { pinMarkerRef.current.setMap(null); } catch {}
        pinMarkerRef.current = null;
      }

      // clear map instance
      if (mapInstance.current) {
        try { mapInstance.current = null; } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      setError("Google Maps failed to initialize");
      setLoading(false);
      return;
    }

    geocoderRef.current = new window.google.maps.Geocoder();

    const boundsRestriction = {
      north: 19.5,
      south: 11,
      west: 74,
      east: 79,
    };

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 7,
      center: { lat: 15.3173, lng: 75.7139 },
      mapTypeControl: true,
      zoomControl: true,
      fullscreenControl: true,
      streetViewControl: true,
      restriction: {
        latLngBounds: boundsRestriction,
        strictBounds: false, // use false so users can pan a little outside but checks still enforced on searches
      },
    });

    mapInstance.current = map;

    addMapControls(map);
    detectUserLocation(map);
    fetchInstitutions();
  };

  // Check if lat/lng inside Karnataka polygon or fallback bounding box
  const isLocationInKarnataka = (latLng) => {
    if (!latLng) return false;
    // First try polygon
    if (isPointInPolygon(latLng, KARNATAKA_POLYGON)) return true;
    // Fallback bounding box
    if (
      latLng.lat >= 11 && latLng.lat <= 19.5 &&
      latLng.lng >= 74 && latLng.lng <= 79
    ) {
      return true;
    }
    return false;
  };

  const addMapControls = (map) => {
    if (!map || !window.google) return;

    // My Location control
    const locationControlDiv = document.createElement("div");
    locationControlDiv.style.margin = "10px";
    const locationButton = document.createElement("button");
    locationButton.innerText = "📍 My Location";
    locationButton.style.cssText = `
      background-color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    `;
    locationButton.title = "Center map on your location";
    locationButton.onclick = () => {
      if (userLocation && mapInstance.current) {
        mapInstance.current.setCenter(userLocation);
        mapInstance.current.setZoom(14);
      } else {
        detectUserLocation(mapInstance.current);
      }
    };
    locationControlDiv.appendChild(locationButton);
    map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(locationControlDiv);

    // Fit All Institutions control
    const fitControlDiv = document.createElement("div");
    fitControlDiv.style.margin = "10px";
    const fitButton = document.createElement("button");
    fitButton.innerText = "🔍 Fit All Institutions";
    fitButton.style.cssText = locationButton.style.cssText;
    fitButton.title = "Zoom map to show all institution markers";
    fitButton.onclick = () => {
      fitMarkersInView();
    };
    fitControlDiv.appendChild(fitButton);
    map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(fitControlDiv);
  };

  const detectUserLocation = (map) => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (!geocoderRef.current) {
          setUserLocation(loc);
          placeUserLocationMarker(loc);
          setLoading(false);
          return;
        }
        try {
          const results = await new Promise((resolve, reject) => {
            geocoderRef.current.geocode({ location: loc }, (res, status) => {
              if (status === "OK") resolve(res);
              else reject(new Error("Reverse geocode failed"));
            });
          });
          const state = extractStateFromResults(results);
          if (state && state.toLowerCase() !== "karnataka") {
            setError("⚠ Your real-time location appears to be outside Karnataka. Map remains unchanged.");
            setLoading(false);
            return;
          }
          setUserLocation(loc);
          placeUserLocationMarker(loc);
          if (mapInstance.current) {
            mapInstance.current.setCenter(loc);
            mapInstance.current.setZoom(14);
          }
          setLoading(false);
        } catch (e) {
          console.error(e);
          setError("Failed to validate your location.");
          setLoading(false);
        }
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setError("Geolocation permission denied or unavailable.");
        setLoading(false);
        if (mapInstance.current) {
          mapInstance.current.setCenter({ lat: 15.3173, lng: 75.7139 });
          mapInstance.current.setZoom(7);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const placeUserLocationMarker = (pos) => {
    if (!mapInstance.current || !pos || !window.google) return;
    if (userLocationMarkerRef.current) {
      try { userLocationMarkerRef.current.setPosition(pos); } catch {}
    } else {
      userLocationMarkerRef.current = new window.google.maps.Marker({
        position: pos,
        map: mapInstance.current,
        title: "You are here",
        icon: { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" },
      });
    }
  };

  const clearMarkers = () => {
    markersRef.current.forEach((m) => {
      try { m.setMap(null); } catch {}
    });
    markersRef.current = [];
    if (pinMarkerRef.current) {
      try { pinMarkerRef.current.setMap(null); } catch {}
      pinMarkerRef.current = null;
    }
  };

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_API_URL}/institutions`);
      let data = Array.isArray(response.data) ? response.data : [];

      // Normalize & filter for Karnataka
      data = data.filter((inst) => {
        if (!inst) return false;
        const hasAddress = inst.address && typeof inst.address === "object";
        const stateOk = hasAddress ? (inst.address.state === "Karnataka" || inst.address.state === "karnataka") : false;
        const hasLoc = inst.location && typeof inst.location.lat === "number" && typeof inst.location.lng === "number";
        if (!stateOk || !hasLoc) return false;
        if (!isLocationInKarnataka(inst.location)) return false;
        return true;
      });

      setInstitutions(data);
      setFilteredInstitutions(data);
      placeMarkers(data);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError("Failed to fetch institutions data");
      setLoading(false);
    }
  };

  const placeMarkers = (instList) => {
    if (!window.google || !window.google.maps || !mapInstance.current) return;
    clearMarkers();

    if (!Array.isArray(instList) || instList.length === 0) {
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    instList.forEach((inst) => {
      if (!inst || !inst.location) return;
      const pos = { lat: inst.location.lat, lng: inst.location.lng };
      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapInstance.current,
        title: inst.name || "Institution",
      });

      const content = `
        <div style="max-width:280px;font-family:Arial,sans-serif;">
          <h3 style="color:#1a5490;margin:0 0 6px 0;">${inst.name || ""}</h3>
          <p style="margin:4px 0;"><strong>Address:</strong> ${inst.address?.full || inst.address?.line || ""}</p>
          <p style="margin:4px 0;"><strong>Contact:</strong> ${inst.contact || "N/A"}</p>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({ content });

      marker.addListener("click", () => {
        markersRef.current.forEach((m) => m.infoWindow && m.infoWindow.close());
        infoWindow.open(mapInstance.current, marker);
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
      bounds.extend(marker.getPosition());
    });

    if (!bounds.isEmpty && !bounds.isEmpty()) {
      mapInstance.current.fitBounds(bounds);
    }
  };

  const fitMarkersInView = () => {
    if (!mapInstance.current || !markersRef.current.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    markersRef.current.forEach((m) => bounds.extend(m.getPosition()));
    mapInstance.current.fitBounds(bounds);
  };

  // Extract administrative_area_level_1 (state) from geocode results
  const extractStateFromResults = (results) => {
    if (!Array.isArray(results)) return null;
    for (const result of results) {
      if (!result || !Array.isArray(result.address_components)) continue;
      for (const comp of result.address_components) {
        if (comp.types && comp.types.includes("administrative_area_level_1")) {
          return comp.long_name;
        }
      }
    }
    return null;
  };

  const isValidKarnatakaPin = (pin) => {
    if (!pin || typeof pin !== "string") return false;
    return KARNATAKA_PIN_REGEX.test(pin.trim());
  };

  const handlePinSearch = async () => {
    setError(null);
    if (!searchInput || !geocoderRef.current) {
      setError("Enter a PIN code.");
      return;
    }

    const pin = searchInput.trim();
    if (!isValidKarnatakaPin(pin)) {
      setError("❌ This PIN code is NOT recognised as a Karnataka PIN. Enter a valid 6-digit Karnataka PIN code.");
      return;
    }

    setLoading(true);
    try {
      const results = await new Promise((resolve, reject) => {
        geocoderRef.current.geocode({ address: pin }, (res, status) => {
          if (status === "OK") resolve(res);
          else reject(new Error("Invalid PIN code or unable to geocode"));
        });
      });

      if (!results || results.length === 0) throw new Error("No results found");

      const state = extractStateFromResults(results);
      if (state && state.toLowerCase() !== "karnataka") {
        setError("❌ This PIN code is NOT in Karnataka. Enter a valid Karnataka PIN code.");
        setLoading(false);
        return;
      }

      const loc = results[0].geometry.location;
      const latLng = { lat: loc.lat(), lng: loc.lng() };

      if (!isLocationInKarnataka(latLng)) {
        setError("❌ This PIN code location is out of Karnataka boundaries.");
        setLoading(false);
        return;
      }

      setUserLocation(latLng);
      if (mapInstance.current) {
        mapInstance.current.setCenter(latLng);
        mapInstance.current.setZoom(14);
      }

      // Place or update pin marker
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setPosition(latLng);
      } else {
        pinMarkerRef.current = new window.google.maps.Marker({
          position: latLng,
          map: mapInstance.current,
          title: `PIN: ${pin}`,
          icon: { url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" },
        });
      }

      setLoading(false);
    } catch (e) {
      console.error(e);
      setError(e.message || "Invalid PIN code");
      setLoading(false);
    }
  };

  const handleInstitutionSearch = (input) => {
    setSearchInput(input);
    if (!input || input.trim() === "") {
      setAutocompleteResults([]);
      setFilteredInstitutions(institutions);
      placeMarkers(institutions);
      return;
    }
    const q = input.toLowerCase();
    const filtered = institutions.filter((inst) => {
      if (!inst || !inst.name) return false;
      return (
        inst.name.toLowerCase().includes(q) &&
        inst.address &&
        (inst.address.state === "Karnataka" || inst.address.state === "karnataka") &&
        inst.location &&
        isLocationInKarnataka(inst.location)
      );
    });
    setFilteredInstitutions(filtered);
    setAutocompleteResults(filtered.slice(0, 5));
    placeMarkers(filtered);
  };

  const handleSelectInstitution = (inst) => {
    if (!inst) return;
    setSearchInput(inst.name || "");
    setAutocompleteResults([]);
    if (!inst.location || !isLocationInKarnataka(inst.location)) {
      setError("❌ Selected institution is not located within Karnataka.");
      return;
    }
    if (mapInstance.current && inst.location) {
      const pos = { lat: inst.location.lat, lng: inst.location.lng };
      mapInstance.current.setCenter(pos);
      mapInstance.current.setZoom(14);
    }
  };

  const handleSearchSubmit = async (e) => {
    e?.preventDefault?.();
    setError(null);
    if (searchMode === "pin") {
      await handlePinSearch();
    } else {
      // exact match check
      const exact = filteredInstitutions.find(
        (i) => i.name && i.name.toLowerCase() === (searchInput || "").toLowerCase()
      );
      if (exact) {
        handleSelectInstitution(exact);
      } else {
        setError("Institution not found");
      }
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "500px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          position: "relative",
        }}
      />

      <form
        onSubmit={handleSearchSubmit}
        style={{ marginTop: "12px", textAlign: "center", position: "relative", zIndex: 1100 }}
      >
        <div style={{ marginBottom: "8px" }}>
          <button
            type="button"
            onClick={() => {
              setSearchMode("pin");
              setSearchInput("");
              setAutocompleteResults([]);
              setError(null);
              placeMarkers(filteredInstitutions);
            }}
            style={{
              padding: "6px 12px",
              marginRight: "8px",
              cursor: "pointer",
              backgroundColor: searchMode === "pin" ? "#1a5490" : "#eee",
              color: searchMode === "pin" ? "#fff" : "#000",
              border: "none",
              borderRadius: "4px",
              fontWeight: "600",
            }}
          >
            Search by PIN Code
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchMode("institution");
              setSearchInput("");
              setAutocompleteResults([]);
              setError(null);
              placeMarkers(institutions);
            }}
            style={{
              padding: "6px 12px",
              cursor: "pointer",
              backgroundColor: searchMode === "institution" ? "#1a5490" : "#eee",
              color: searchMode === "institution" ? "#fff" : "#000",
              border: "none",
              borderRadius: "4px",
              fontWeight: "600",
            }}
          >
            Search by Institution
          </button>
        </div>

        <input
          type="text"
          placeholder={searchMode === "pin" ? "Enter Karnataka PIN code (e.g. 560001)" : "Enter Institution name"}
          value={searchInput}
          onChange={(e) => {
            const val = e.target.value;
            setSearchInput(val);
            if (searchMode === "institution") handleInstitutionSearch(val);
          }}
          style={{
            width: "70%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />

        {autocompleteResults.length > 0 && searchMode === "institution" && (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "4px auto",
              width: "70%",
              maxHeight: "150px",
              overflowY: "auto",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              cursor: "pointer",
              position: "absolute",
              zIndex: 1200,
            }}
          >
            {autocompleteResults.map((inst) => (
              <li
                key={inst.id ?? inst.name}
                onClick={() => handleSelectInstitution(inst)}
                style={{ padding: "8px", borderBottom: "1px solid #eee" }}
              >
                {inst.name}
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: "8px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 20px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "#1a5490",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            Search
          </button>
        </div>
      </form>

      <div style={{ marginTop: "12px", textAlign: "center", color: "red", fontWeight: "600" }}>
        {error && <p>{error}</p>}
      </div>

      <div style={{ marginTop: "12px", color: "#666", textAlign: "center" }}>
        {userLocation && (
          <p>
            📍 Current Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}
