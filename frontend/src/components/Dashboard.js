import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getVisits, getLeases, getAdminProperties, deleteProperty } from '../api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [visits, setVisits] = useState([]);
  const [leases, setLeases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [visitsData, leasesData] = await Promise.all([
        getVisits().catch(() => []),
        getLeases().catch(() => [])
      ]);

      setVisits(visitsData);
      setLeases(leasesData);

      // Load properties if user is owner or admin
      if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
        const propertiesData = await getAdminProperties().catch(() => []);
        setProperties(propertiesData);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProperty(id) {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;
    try {
      await deleteProperty(id);
      // Refresh properties list
      if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
        const propertiesData = await getAdminProperties().catch(() => []);
        setProperties(propertiesData);
      }
    } catch (err) {
      console.error('Failed to delete property:', err);
      alert('Failed to delete property: ' + (err?.message || 'Unknown error'));
    }
  }

  if (!user) {
    return (
      <div className="content">
        <div className="text-center" style={{ padding: '4rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Please Sign In</h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            You need to be signed in to access your dashboard.
          </p>
          <Link to="/auth" className="btn">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="dashboard-grid">
        {/* Sidebar */}
        <div className="sidebar">
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '1.5rem',
              margin: '0 auto 1rem'
            }}>
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <h3 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{user.name}</h3>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
              {user.role}
            </p>
          </div>

          <nav>
            <button
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'active' : ''}
              style={{ 
                width: '100%', 
                textAlign: 'left', 
                background: 'none', 
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={activeTab === 'visits' ? 'active' : ''}
              style={{ 
                width: '100%', 
                textAlign: 'left', 
                background: 'none', 
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              📅 My Visits
            </button>
            <button
              onClick={() => setActiveTab('leases')}
              className={activeTab === 'leases' ? 'active' : ''}
              style={{ 
                width: '100%', 
                textAlign: 'left', 
                background: 'none', 
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              📋 My Leases
            </button>
            {(user.role === 'OWNER' || user.role === 'ADMIN') && (
              <button
                onClick={() => setActiveTab('properties')}
                className={activeTab === 'properties' ? 'active' : ''}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  background: 'none', 
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                🏠 My Properties
              </button>
            )}
          </nav>
        </div>

        {/* Main Content */}
        <div>
          {loading ? (
            <div className="text-center" style={{ padding: '4rem' }}>
              <div className="loading" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
              <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading dashboard...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div>
                  <h2 style={{ marginBottom: '2rem' }}>Dashboard Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                      <h3 style={{ fontSize: '2rem', fontWeight: '800', color: '#667eea' }}>{visits.length}</h3>
                      <p style={{ color: '#6b7280' }}>Scheduled Visits</p>
                    </div>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                      <h3 style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>{leases.length}</h3>
                      <p style={{ color: '#6b7280' }}>Active Leases</p>
                    </div>
                    {(user.role === 'OWNER' || user.role === 'ADMIN') && (
                      <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <h3 style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>{properties.length}</h3>
                        <p style={{ color: '#6b7280' }}>My Properties</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'visits' && (
                <div>
                  <h2 style={{ marginBottom: '2rem' }}>My Visits</h2>
                  {visits.length === 0 ? (
                    <div className="text-center" style={{ padding: '3rem' }}>
                      <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No visits scheduled yet.</p>
                      <Link to="/" className="btn">Browse Properties</Link>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Date & Time</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visits.map((visit) => (
                            <tr key={visit.id}>
                              <td>{visit.propertyTitle || 'Property'}</td>
                              <td>{new Date(visit.visitDateTime).toLocaleString()}</td>
                              <td>
                                <span className={`badge ${visit.status === 'PENDING' ? 'badge-warning' : 'badge-success'}`}>
                                  {visit.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'leases' && (
                <div>
                  <h2 style={{ marginBottom: '2rem' }}>My Leases</h2>
                  {leases.length === 0 ? (
                    <div className="text-center" style={{ padding: '3rem' }}>
                      <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No lease applications yet.</p>
                      <Link to="/" className="btn">Browse Properties</Link>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Monthly Rent</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leases.map((lease) => (
                            <tr key={lease.id}>
                              <td>{lease.property?.title || 'Property'}</td>
                              <td>{new Date(lease.startDate).toLocaleDateString()}</td>
                              <td>{new Date(lease.endDate).toLocaleDateString()}</td>
                              <td>${lease.monthlyRent?.toLocaleString()}</td>
                              <td>
                                <span className={`badge ${lease.status === 'DRAFT' ? 'badge-warning' : 'badge-success'}`}>
                                  {lease.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'properties' && (user.role === 'OWNER' || user.role === 'ADMIN') && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>My Properties</h2>
                    <Link to="/post" className="btn">+ Add Property</Link>
                  </div>
                  {properties.length === 0 ? (
                    <div className="text-center" style={{ padding: '3rem' }}>
                      <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No properties listed yet.</p>
                      <Link to="/post" className="btn">List Your First Property</Link>
                    </div>
                  ) : (
                    <div className="property-grid">
                      {properties.map((property) => (
                        <div key={property.id} className="property-card">
                          <Link to={`/property/${property.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                              {property.title}
                            </h3>
                          </Link>
                          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                            {property.address}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#667eea' }}>
                              ${property.price?.toLocaleString()}
                            </span>
                            <span className={`badge ${property.available ? 'badge-success' : 'badge-danger'}`}>
                              {property.available ? 'Available' : 'Occupied'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <Link to={`/property/${property.id}`} className="btn-secondary">View</Link>
                            <button className="btn-danger" onClick={() => handleDeleteProperty(property.id)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
