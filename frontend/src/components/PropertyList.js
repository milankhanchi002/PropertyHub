import React, { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080/api/properties";

export default function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  async function fetchProperties(searchCity = "") {
    setLoading(true);

    try {
      const url = searchCity ? `${API_BASE_URL}?city=${encodeURIComponent(searchCity)}` : API_BASE_URL;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Status: ${res.status}`);
      }

      const data = await res.json();
      setProperties(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load properties: " + err.message);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    fetchProperties(city);
  }

  function handleReset() {
    setCity("");
    setProperties([]);
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Available Properties</h2>

      <div className="flex justify-center items-center mb-8 space-x-2">
        <input
          className="border-2 border-gray-300 rounded-full px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          type="text"
          placeholder="Search properties by city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white rounded-full px-6 py-2 hover:bg-blue-700 transition-all duration-200"
        >
          Search
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-400 text-white rounded-full px-6 py-2 hover:bg-gray-500 transition-all duration-200"
        >
          Reset
        </button>
      </div>

      {loading ? (
        <div className="text-center p-4">Loading properties...</div>
      ) : properties.length === 0 ? (
        <p className="text-center text-gray-500">No properties found.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <li key={p.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <Link to={`/property/${p.id}`} className="block">
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{p.title}</h3>
                  <p className="text-gray-600 font-medium mb-3">{p.address}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    <span className="font-semibold">{p.city}</span> | <span className="uppercase">{p.type}</span>
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">${p.price}</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${p.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {p.available ? 'Available' : 'Occupied'}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
