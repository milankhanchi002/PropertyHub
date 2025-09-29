import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getVisits, updateVisitStatus, getLeases, getAdminProperties, getOwnerProperties, deleteProperty, toggleProperty, getVisitsByOwner, getVisitsByTenant, updateLeaseStatus } from '../api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [visits, setVisits] = useState([]);
  const [leases, setLeases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, type: 'info', message: '' });
  const [toggling, setToggling] = useState({}); // { [propertyId]: true }
  const [errorMsg, setErrorMsg] = useState('');
  const loadingRef = useRef(false);
  const abortRef = useRef(null);
  const [loaded, setLoaded] = useState({ overview: false, visits: false, leases: false, properties: false });

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const formatINR = (value) => {
    if (value === null || value === undefined) return '₹0';
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
    } catch {
      return `₹${Number(value).toLocaleString('en-IN')}`;
    }
  };

  async function handleLeaseDecision(lease, value) {
    try {
      const updated = await updateLeaseStatus(lease.id, value);
      setLeases(prev => prev.map(l => l.id === lease.id ? { ...l, status: updated.status } : l));
      showToast('success', `Lease ${value.toLowerCase()} successfully`);
    } catch (err) {
      console.error('Failed to update lease status:', err);
      showToast('error', 'Failed to update lease: ' + (err?.message || 'Unknown error'));
    }
  }

  async function handleToggleAvailability(property) {
    try {
      const updated = await toggleProperty(property.id);
      // Optimistically update current list for snappier UI
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, available: updated?.available ?? !p.available } : p));
      if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
        const propertiesData = await getOwnerOrAdminProperties();
        setProperties(propertiesData);
      }
      const newStatus = updated?.available ?? !property.available;
      showToast('success', `Property marked as ${newStatus ? 'Available' : 'Occupied'}`);
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      showToast('error', 'Failed to toggle availability: ' + (err?.message || 'Unknown error'));
    }
  }

  // helper: fetch ONLY properties owned by the signed-in user (even for ADMIN)
  async function getOwnerOrAdminProperties() {
    if (!user?.id) return [];
    return await getOwnerProperties(user.id).catch(() => []);
  }

  const loadTabData = useCallback(async (tab) => {
    if (loadingRef.current) return; // prevent overlapping loads
    // If already loaded once, do not re-fetch automatically
    if (loaded[tab]) {
      setLoading(false);
      return;
    }
    loadingRef.current = true;
    setLoading(true);
    setErrorMsg('');
    // abort previous if any
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      if (tab === 'visits') {
        // Role-scoped visits
        let visitsData = [];
        if (user?.role === 'TENANT') {
          visitsData = await getVisitsByTenant(user.email).catch(() => []);
        } else if (user?.role === 'OWNER') {
          visitsData = await getVisitsByOwner(user.id).catch(() => []);
        } else if (user?.role === 'ADMIN') {
          visitsData = await getVisits().catch(() => []);
        }
        setVisits(visitsData || []);
        setLoaded(prev => ({ ...prev, visits: true }));
      } else if (tab === 'leases') {
        const leasesData = await getLeases().catch(() => []);
        setLeases(leasesData || []);
        setLoaded(prev => ({ ...prev, leases: true }));
      } else if (tab === 'properties') {
        // Load properties for owner/admin only
        const propertiesData = await getOwnerOrAdminProperties();
        setProperties(propertiesData || []);
        setLoaded(prev => ({ ...prev, properties: true }));
      } else if (tab === 'overview') {
        // Lightweight default: load minimal needed, sequentially to reduce concurrency
        let v = [];
        if (user?.role === 'TENANT') v = await getVisitsByTenant(user.email).catch(() => []);
        else if (user?.role === 'OWNER') v = await getVisitsByOwner(user.id).catch(() => []);
        else if (user?.role === 'ADMIN') v = await getVisits().catch(() => []);
        setVisits(v || []);

        const l = await getLeases().catch(() => []);
        setLeases(l || []);

        if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
          const propertiesData = await getOwnerOrAdminProperties();
          setProperties(propertiesData || []);
        }
        setLoaded(prev => ({ ...prev, overview: true }));
      }
    } catch (err) {
      console.error('Error loading tab data:', err);
      setErrorMsg(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      loadingRef.current = false;
      setLoaded(prev => ({ ...prev, [tab]: true }));
    }
  }, [user, loaded]);

  const initRef = useRef(false);
  useEffect(() => {
    // Prevent StrictMode double-effect on mount
    if (!initRef.current) {
      initRef.current = true;
      loadTabData(activeTab);
      return;
    }
    // On actual tab changes, load as needed
    loadTabData(activeTab);
  // Intentionally exclude loadTabData from deps to keep a stable trigger
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Safety net: stop spinner if something keeps pending too long
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      setLoading(false);
      setErrorMsg(prev => prev || 'Taking longer than usual. Please refresh the page.');
    }, 8000);
    return () => clearTimeout(t);
  }, [loading]);

  async function handleToggleVisitStatus(visit) {
    const current = visit.status;
    const next = current === 'PENDING' ? 'DONE' : 'PENDING';
    try {
      const updated = await updateVisitStatus(visit.id, next);
      setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, status: updated.status } : v));
      showToast('success', `Visit marked as ${updated.status}`);
    } catch (err) {
      console.error('Failed to update visit status:', err);
      showToast('error', 'Failed to update visit status: ' + (err?.message || 'Unknown error'));
    }
  }

  async function handleDeleteProperty(id) {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;
    try {
      // Optimistically update UI first
      setProperties(prev => prev.filter(p => p.id !== id));
      await deleteProperty(id);
      // Refresh properties list
      if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
        const propertiesData = await getOwnerOrAdminProperties().catch(() => []);
        setProperties(propertiesData || []);
      }
      showToast('success', 'Property deleted successfully');
    } catch (err) {
      console.error('Failed to delete property:', err);
      showToast('error', 'Failed to delete property: ' + (err?.message || 'Unknown error'));
    }
  }

  function showToast(type, message) {
    setToast({ visible: true, type, message });
    // auto-hide after 3 seconds
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
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
      {/* Toast Notification */}
      {toast.visible && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: 9999,
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            color: '#fff',
            background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)'
          }}
          role="alert"
        >
          {toast.message}
        </div>
      )}
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
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#4a5568',
                fontWeight: 600
              }}
            >
              <span role="img" aria-label="overview">📊</span>
              <span>Overview</span>
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
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#4a5568',
                fontWeight: 600
              }}
            >
              <span role="img" aria-label="visits">📅</span>
              <span>My Visits</span>
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
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#4a5568',
                fontWeight: 600
              }}
            >
              <span role="img" aria-label="leases">📋</span>
              <span>My Leases</span>
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
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#4a5568',
                  fontWeight: 600
                }}
              >
                <span role="img" aria-label="properties">🏠</span>
                <span>My Properties (Owned)</span>
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
              {errorMsg && (
                <p style={{ marginTop: '0.5rem', color: '#ef4444' }}>{errorMsg}</p>
              )}
            </div>
          ) : (
            <>
              {errorMsg && (
                <div style={{
                  background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #fecaca'
                }}>
                  {errorMsg}
                </div>
              )}
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
                    <div className="table-container" style={{ overflowX: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Date & Time</th>
                            <th>Status</th>
                            {(user.role === 'OWNER') && <th>Action</th>}
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
                              {(user.role === 'OWNER') && (
                                <td>
                                  <button className="btn-secondary" onClick={() => handleToggleVisitStatus(visit)}>
                                    Mark {visit.status === 'PENDING' ? 'Done' : 'Pending'}
                                  </button>
                                </td>
                              )}
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
                    </div>
                  ) : (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Applicant</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Monthly Rent</th>
                            <th>Status</th>
                            {(user.role === 'OWNER' || user.role === 'ADMIN') && <th>Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {leases.map((lease) => (
                            <tr key={lease.id}>
                              <td>{lease.propertyTitle || 'Property'}</td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 600 }}>{lease.tenantName || '—'}</span>
                                  {lease.tenantEmail && (
                                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{lease.tenantEmail}</span>
                                  )}
                                </div>
                              </td>
                              <td>{new Date(lease.startDate).toLocaleDateString()}</td>
                              <td>{new Date(lease.endDate).toLocaleDateString()}</td>
                              <td>{formatINR(lease.monthlyRent)}</td>
                              <td>
                                <span className={`badge ${lease.status === 'DRAFT' ? 'badge-warning' : 'badge-success'}`}>
                                  {lease.status}
                                </span>
                              </td>
                              {(user.role === 'OWNER' || user.role === 'ADMIN') && (
                                <td>
                                  {lease.status === 'DRAFT' ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                      <button className="btn-success" onClick={() => handleLeaseDecision(lease, 'APPROVED')}>Approve</button>
                                      <button className="btn-danger" onClick={() => handleLeaseDecision(lease, 'REJECTED')}>Reject</button>
                                    </div>
                                  ) : (
                                    <button className="btn-secondary" onClick={() => handleLeaseDecision(lease, 'DRAFT')}>Mark Draft</button>
                                  )}
                                </td>
                              )}
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
                    <div className="property-grid" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '1.25rem'
                    }}>
                      {properties.map((property) => (
                        <div key={property.id} className="property-card">
                          <Link to={`/property/${property.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h3 className="property-title truncate" style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                              {property.title}
                            </h3>
                          </Link>
                          <p className="property-address" style={{ color: '#6b7280', marginBottom: '0.75rem' }}>
                            {property.address}
                          </p>
                          <div className="property-meta-row" style={{ marginBottom: '0.75rem' }}>
                            <span className="property-price">
                              {formatINR(property.price)}
                            </span>
                            <span className={`badge ${property.available ? 'badge-success' : 'badge-danger'}`}>
                              {property.available ? 'Available' : 'Occupied'}
                            </span>
                            <span className="property-status">Status: {property.available ? 'Available' : 'Occupied'}</span>
                          </div>
                          <div className="property-actions-row" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              className={property.available ? 'btn-secondary' : 'btn-success'}
                              onClick={() => handleToggleAvailability(property)}
                              disabled={!!toggling[property.id]}
                            >
                              {toggling[property.id] ? 'Updating…' : (property.available ? 'Mark Occupied' : 'Mark Available')}
                            </button>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                              <Link to={`/property/${property.id}`} className="btn btn-secondary" style={{ textDecoration: 'none' }}>View</Link>
                              <button className="btn-danger" onClick={() => handleDeleteProperty(property.id)}>
                                Delete
                              </button>
                            </div>
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
