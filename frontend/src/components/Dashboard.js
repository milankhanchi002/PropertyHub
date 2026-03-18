import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getLeases, getOwnerProperties, deleteProperty, toggleProperty, getVisitsByOwner, getVisitsByTenant, updateVisitStatus, requestVisitReschedule, decideVisitReschedule, tenantUpdateVisitStatus, getVisitMessages, postVisitMessage, getLeaseMessages, postLeaseMessage, updateLeaseStatus } from '../api';
import websocketService from '../services/websocket';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [visits, setVisits] = useState([]);
  const [leases, setLeases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loaded, setLoaded] = useState({ overview: false, visits: false, leases: false, properties: false });
  const [toast, setToast] = useState({ visible: false, type: '', message: '' });
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleVisit, setRescheduleVisit] = useState(null);
  const [rescheduleInput, setRescheduleInput] = useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  
  // Chat state variables
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatType, setChatType] = useState(''); // 'visit' or 'lease'
  const [chatOwner, setChatOwner] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSubmitting, setChatSubmitting] = useState(false);
  
  const loadingRef = useRef(false);
  const abortRef = useRef(null);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  function showToast(type, message) {
    setToast({ visible: true, type, message });
    // auto-hide after 3 seconds
    setTimeout(() => setToast({ visible: false, type, message }), 3000);
  }

  // Owner approves visit request
  async function handleApproveVisit(visit) {
    try {
      const updated = await updateVisitStatus(visit.id, 'APPROVED');
      setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, status: updated.status } : v));
      showToast('success', 'Visit approved successfully');
    } catch (err) {
      console.error('Failed to approve visit:', err);
      showToast('error', 'Failed to approve visit: ' + (err?.message || 'Unknown error'));
    }
  }

  // Owner rejects visit request
  async function handleRejectVisit(visit) {
    try {
      const updated = await updateVisitStatus(visit.id, 'REJECTED');
      setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, status: updated.status } : v));
      showToast('success', 'Visit rejected');
    } catch (err) {
      console.error('Failed to reject visit:', err);
      showToast('error', 'Failed to reject visit: ' + (err?.message || 'Unknown error'));
    }
  }

  // Owner approves lease application
  async function handleApproveLease(lease) {
    try {
      const updated = await updateLeaseStatus(lease.id, 'APPROVED');
      setLeases(prev => prev.map(l => l.id === lease.id ? { ...l, status: updated.status } : l));
      showToast('success', 'Lease approved successfully');
    } catch (err) {
      console.error('Failed to approve lease:', err);
      showToast('error', 'Failed to approve lease: ' + (err?.message || 'Unknown error'));
    }
  }

  // Owner rejects lease application
  async function handleRejectLease(lease) {
    try {
      const updated = await updateLeaseStatus(lease.id, 'REJECTED');
      setLeases(prev => prev.map(l => l.id === lease.id ? { ...l, status: updated.status } : l));
      showToast('success', 'Lease rejected');
    } catch (err) {
      console.error('Failed to reject lease:', err);
      showToast('error', 'Failed to reject lease: ' + (err?.message || 'Unknown error'));
    }
  }

  async function handleTenantToggleVisitStatus(visit) {
    // Real-life logic: APPROVED ↔ DONE, never PENDING
    const next = visit.status === 'APPROVED' ? 'DONE' : 'APPROVED';
    try {
      const updated = await tenantUpdateVisitStatus(visit.id, next);
      setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, status: updated.status } : v));
      showToast('success', `Visit marked as ${next}`);
    } catch (err) {
      console.error('Failed to update visit status:', err);
      showToast('error', 'Failed to update visit: ' + (err?.message || 'Unknown error'));
    }
  }

  async function handleToggleAvailability(property) {
    try {
      const updated = await toggleProperty(property.id);
      // Optimistically update current list for snappier UI
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, available: updated?.available ?? !p.available } : p));
      // Refresh properties list
      const propertiesData = await getUserProperties();
      setProperties(propertiesData);
      const newStatus = updated?.available ?? !property.available;
      showToast('success', `Property marked as ${newStatus ? 'Available' : 'Occupied'}`);
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      showToast('error', 'Failed to toggle availability: ' + (err?.message || 'Unknown error'));
    }
  }

  // helper: fetch properties owned by signed-in user
  async function getUserProperties() {
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
        // Load visits based on user role - don't combine them
        const ownerVisits = await getVisitsByOwner(user.id).catch(() => []);
        const tenantVisits = await getVisitsByTenant(user.email).catch(() => []);
        
        // Set visits with role information for each visit
        const visitsWithRole = [
          ...ownerVisits.map(v => ({ ...v, userRole: 'owner' })),
          ...tenantVisits.map(v => ({ ...v, userRole: 'tenant' }))
        ].filter((visit, index, self) => 
          index === self.findIndex(v => v.id === visit.id)
        );
        
        setVisits(visitsWithRole || []);
        setLoaded(prev => ({ ...prev, visits: true }));
      } else if (tab === 'leases') {
        const leasesData = await getLeases().catch(() => []);
        setLeases(leasesData || []);
        setLoaded(prev => ({ ...prev, leases: true }));
      } else if (tab === 'properties') {
        // Load properties owned by user
        const propertiesData = await getUserProperties();
        setProperties(propertiesData || []);
        setLoaded(prev => ({ ...prev, properties: true }));
      } else if (tab === 'overview') {
        // Load all data for overview with role information
        const ownerVisits = await getVisitsByOwner(user.id).catch(() => []);
        const tenantVisits = await getVisitsByTenant(user.email).catch(() => []);
        
        const visitsWithRole = [
          ...ownerVisits.map(v => ({ ...v, userRole: 'owner' })),
          ...tenantVisits.map(v => ({ ...v, userRole: 'tenant' }))
        ].filter((visit, index, self) => 
          index === self.findIndex(v => v.id === visit.id)
        );
        
        setVisits(visitsWithRole || []);

        const l = await getLeases().catch(() => []);
        setLeases(l || []);

        const propertiesData = await getUserProperties();
        setProperties(propertiesData || []);
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
  }, [user?.id, user?.email, getUserProperties, loaded]);

  useEffect(() => {
    if (!user) return;
    loadTabData(activeTab);
    return () => {
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
    };
  }, [activeTab, loadTabData, user]);

  // WebSocket connection effect
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to WebSocket
    websocketService.connect(token)
      .then(() => {
        console.log('WebSocket connected successfully');
      })
      .catch((error) => {
        console.error('WebSocket connection failed:', error);
      });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, [user]);

  async function handleDeleteProperty(id) {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;
    try {
      // Optimistically update UI first
      setProperties(prev => prev.filter(p => p.id !== id));
      await deleteProperty(id);
      // Refresh properties list
      const propertiesData = await getUserProperties().catch(() => []);
      setProperties(propertiesData || []);
      showToast('success', 'Property deleted successfully');
    } catch (err) {
      console.error('Failed to delete property:', err);
      showToast('error', 'Failed to delete property: ' + (err?.message || 'Unknown error'));
    }
  }

  // Chat functions
  async function openVisitChat(visit) {
    const isOwner = properties.some(p => p.id === visit.propertyId);
    setChatTarget(visit);
    setChatType('visit');
    setChatOwner(isOwner);
    setChatOpen(true);
    setChatMessages([]);
    setChatInput('');
    
    // Load existing messages
    try {
      const messages = await getVisitMessages(visit.id);
      setChatMessages(messages || []);
    } catch (err) {
      console.error('Failed to load visit messages:', err);
    }

    // Subscribe to real-time WebSocket messages
    if (websocketService.isConnected()) {
      websocketService.subscribeToVisitChat(visit.id, (newMessage) => {
        // Add new message to chat
        setChatMessages(prev => [...prev, {
          id: Date.now(), // temporary ID
          message: newMessage.content,
          senderName: newMessage.senderName,
          senderRole: isOwner ? 'TENANT' : 'OWNER', // Opposite role for display
          createdAt: newMessage.timestamp
        }]);
      });
    }
  }

  async function openLeaseChat(lease) {
    // For lease chat, we need to determine if user is owner or tenant
    const isOwner = properties.some(p => p.id === lease.propertyId);
    setChatTarget(lease);
    setChatType('lease');
    setChatOwner(isOwner);
    setChatOpen(true);
    setChatMessages([]);
    setChatInput('');
    
    // Load existing messages
    try {
      const messages = await getLeaseMessages(lease.id);
      setChatMessages(messages || []);
    } catch (err) {
      console.error('Failed to load lease messages:', err);
    }

    // Subscribe to real-time WebSocket messages
    if (websocketService.isConnected()) {
      websocketService.subscribeToLeaseChat(lease.id, (newMessage) => {
        // Add new message to chat
        setChatMessages(prev => [...prev, {
          id: Date.now(), // temporary ID
          message: newMessage.content,
          senderName: newMessage.senderName,
          senderRole: isOwner ? 'TENANT' : 'OWNER', // Opposite role for display
          createdAt: newMessage.timestamp
        }]);
      });
    }
  }

  async function sendChatMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || chatSubmitting) return;
    setChatSubmitting(true);
    try {
      const newMessage = chatType === 'visit' 
        ? await postVisitMessage(chatTarget.id, chatInput)
        : await postLeaseMessage(chatTarget.id, chatInput);
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('error', 'Failed to send message');
    } finally {
      setChatSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="text-center" style={{ padding: '4rem' }}>
        <h2>Please log in to view your dashboard</h2>
        <Link to="/login" className="btn">Login</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {toast.visible && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          color: 'white',
          fontWeight: '600',
          zIndex: 1000,
          background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)'
        }}
          role="alert"
        >
          {toast.message}
        </div>
      )}
      {chatOpen && chatTarget && (
        <div className="modal-overlay" onClick={() => setChatOpen(false)}>
          <div className="modal-content chat-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Chat - {chatType === 'visit' ? `Visit #${chatTarget.id}` : `Lease #${chatTarget.id}`}</h3>
              <button 
                type="button" 
                onClick={() => setChatOpen(false)} 
                style={{ 
                  background: '#ef4444', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '30px', 
                  height: '30px', 
                  fontSize: '1.2rem', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <div className="chat-messages" style={{ height: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '1rem', marginBottom: '1rem' }}>
              {chatMessages.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center' }}>No messages yet. Start the conversation!</p>
              ) : (
                chatMessages.map(msg => {
                  // Check if the current user sent this message
                  const isCurrentUser = msg.senderName === user?.name;
                  
                  return (
                  <div key={msg.id} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      {isCurrentUser ? 'You' : (msg.senderName || 'Unknown User')} • {new Date(msg.createdAt).toLocaleString()}
                    </div>
                    <div style={{ 
                      background: isCurrentUser ? '#667eea' : '#f3f4f6', 
                      color: isCurrentUser ? 'white' : '#1f2937',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      maxWidth: '80%',
                      alignSelf: isCurrentUser ? 'flex-end' : 'flex-start'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            <form onSubmit={sendChatMessage} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message..."
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                required
              />
              <button type="submit" disabled={chatSubmitting} className="btn">
                {chatSubmitting ? 'Sending…' : 'Send'}
              </button>
            </form>
            
            {/* Close button at bottom */}
            <div style={{ textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={() => setChatOpen(false)} 
                className="btn-secondary"
                style={{ fontSize: '0.875rem' }}
              >
                Close Chat
              </button>
            </div>
          </div>
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
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{user.name}</h3>
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                {user.email}
              </p>
            </div>
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
              <span>My Properties</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="main-content">
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
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <h3 style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>{properties.length}</h3>
                        <p style={{ color: '#6b7280' }}>My Properties</p>
                      </div>
                  </div>
                </div>
              )}

              {activeTab === 'visits' && (
                <div>
                  <h2 style={{ marginBottom: '2rem' }}>My Visits</h2>
                  <div style={{ 
                    background: '#f0f9ff', 
                    border: '1px solid #bae6fd', 
                    borderRadius: '0.5rem', 
                    padding: '1rem', 
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                    color: '#0c4a6e'
                  }}>
                    <strong>📋 Visit Management:</strong> As a property owner, you can approve/reject visit requests. As a visitor, you can track your visit status and communicate with property owners.
                  </div>
                  {visits.length === 0 ? (
                    <div className="text-center" style={{ padding: '3rem' }}>
                      <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No visits scheduled yet.</p>
                      <Link to="/" className="btn">Browse Properties</Link>
                    </div>
                  ) : (
                    <div className="table-container" style={{ 
                      overflowX: 'auto',
                      fontSize: '0.875rem' // Smaller font for better fit
                    }}>
                      <table style={{ minWidth: '800px' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '0.5rem' }}>Property</th>
                            <th style={{ padding: '0.5rem' }}>Visitor/Owner</th>
                            <th style={{ padding: '0.5rem' }}>Date</th>
                            <th style={{ padding: '0.5rem' }}>Price</th>
                            <th style={{ padding: '0.5rem' }}>Status</th>
                            <th style={{ padding: '0.5rem' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visits.map(visit => {
                            // Use the userRole field to determine user's relationship to this visit
                            const isOwner = visit.userRole === 'owner';
                            
                            return (
                            <tr key={visit.id}>
                              <td>
                                <Link to={`/property/${visit.propertyId}`} style={{ textDecoration: 'none', color: '#667eea' }}>
                                  {visit.propertyTitle || `Property #${visit.propertyId}`}
                                </Link>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.875rem' }}>
                                  {isOwner ? (
                                    <span style={{ color: '#6b7280' }}>
                                      👤 {visit.tenantName || visit.tenantEmail}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#059669' }}>
                                      🏠 Property Owner
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>{visit.visitDateTime ? new Date(visit.visitDateTime).toLocaleString() : 'N/A'}</td>
                              <td style={{ fontWeight: '600', color: '#059669' }}>
                                ₹{visit.propertyPrice ? visit.propertyPrice.toLocaleString() : 'N/A'}
                              </td>
                              <td style={{ padding: '0.5rem' }}>
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  background: visit.status === 'DONE' ? '#10b981' : visit.status === 'APPROVED' ? '#3b82f6' : visit.status === 'PENDING' ? '#f59e0b' : visit.status === 'REJECTED' ? '#ef4444' : '#6b7280',
                                  color: 'white'
                                }}>
                                  {visit.status}
                                </span>
                                {visit.rescheduleStatus === 'PENDING' && (
                                  <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: '#7c3aed', 
                                    marginTop: '0.25rem',
                                    fontWeight: '600'
                                  }}>
                                    📅 Reschedule to: {visit.proposedDateTime ? new Date(visit.proposedDateTime).toLocaleString() : 'New time'}
                                    {!isOwner && (
                                      <div style={{ color: '#dc2626', marginTop: '0.25rem' }}>
                                        ⚠️ Your action needed: Approve or Reject
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <button className="btn" onClick={() => openVisitChat(visit)}>
                                    💬 Chat
                                  </button>
                                  
                                  {/* Owner Actions */}
                                  {isOwner && visit.status === 'PENDING' && (
                                    <>
                                      <button className="btn-success" onClick={() => handleApproveVisit(visit)}>
                                        ✓ Approve
                                      </button>
                                      <button className="btn-danger" onClick={() => handleRejectVisit(visit)}>
                                        ✗ Reject
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* Tenant Actions */}
                                  {!isOwner && (visit.status === 'APPROVED' || visit.status === 'DONE') && (
                                    <button className="btn-secondary" onClick={() => handleTenantToggleVisitStatus(visit)}>
                                      {visit.status === 'DONE' ? '↺ Mark Not Done' : '✓ Mark Done'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            );
                          })}
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
                    <div className="table-container" style={{ 
                      overflowX: 'auto',
                      fontSize: '0.875rem' // Smaller font for better fit
                    }}>
                      <table style={{ minWidth: '900px' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '0.5rem' }}>Property</th>
                            <th style={{ padding: '0.5rem' }}>Tenant</th>
                            <th style={{ padding: '0.5rem' }}>Start Date</th>
                            <th style={{ padding: '0.5rem' }}>End Date</th>
                            <th style={{ padding: '0.5rem' }}>Monthly Rent</th>
                            <th style={{ padding: '0.5rem' }}>Status</th>
                            <th style={{ padding: '0.5rem' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leases.map(lease => (
                            <tr key={lease.id}>
                              <td>
                                <Link to={`/property/${lease.propertyId}`} style={{ textDecoration: 'none', color: '#667eea' }}>
                                  {lease.propertyTitle || `Property #${lease.propertyId}`}
                                </Link>
                              </td>
                              <td>{lease.tenantEmail}</td>
                              <td>{lease.startDate ? new Date(lease.startDate).toLocaleDateString() : 'N/A'}</td>
                              <td>{lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'N/A'}</td>
                              <td style={{ fontWeight: '600', color: '#059669' }}>
                                ₹{lease.monthlyRent ? lease.monthlyRent.toLocaleString() : 'N/A'}
                              </td>
                              <td>
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  background: lease.status === 'ACTIVE' ? '#10b981' : lease.status === 'APPROVED' ? '#3b82f6' : lease.status === 'DRAFT' ? '#6b7280' : lease.status === 'REJECTED' ? '#ef4444' : '#f59e0b',
                                  color: 'white'
                                }}>
                                  {lease.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <button className="btn" onClick={() => openLeaseChat(lease)}>
                                    💬 Chat
                                  </button>
                                  
                                  {/* Owner Actions */}
                                  {properties.some(p => p.id === lease.propertyId) && lease.status === 'DRAFT' && (
                                    <>
                                      <button className="btn-success" onClick={() => handleApproveLease(lease)}>
                                        ✓ Approve
                                      </button>
                                      <button className="btn-danger" onClick={() => handleRejectLease(lease)}>
                                        ✗ Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'properties' && (
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
                            <p className="property-address truncate" style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                              {property.address}, {property.city}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <span className="property-price" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
                                ₹{property.price?.toLocaleString('en-IN') || 'N/A'}
                                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '400' }}>/month</span>
                              </span>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: property.available ? '#10b981' : '#ef4444',
                                color: 'white'
                              }}>
                                {property.available ? 'Available' : 'Occupied'}
                              </span>
                            </div>
                          </Link>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                            <button className="btn-secondary" onClick={() => window.location.href = `/property/${property.id}`}>
                              View
                            </button>
                            <button className="btn" onClick={() => handleToggleAvailability(property)}>
                              {property.available ? 'Mark Occupied' : 'Mark Available'}
                            </button>
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
