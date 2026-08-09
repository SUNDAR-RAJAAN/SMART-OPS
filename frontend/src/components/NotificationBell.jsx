import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Bell, Check, AtSign, MessageSquare, X } from 'lucide-react';

export default function NotificationBell({ onSelectTaskID }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchUnread = async () => {
    if (!token) return;
    try {
      const data = await api.getUnreadNotifications(token);
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed fetching unread notifications:', err);
    }
  };

  useEffect(() => {
    fetchUnread();
  }, [token]);

  // Real-time WebSocket Push Notification listener
  useEffect(() => {
    if (!token) return;

    const wsUrl = `ws://localhost:8080/ws/notifications?token=${token}`;
    let socket = null;

    try {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data);
          setNotifications((prev) => [newNotif, ...prev]);

          // Show floating toast alert
          setToast(newNotif);
          setTimeout(() => setToast(null), 5000);
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }

    return () => {
      if (socket) socket.close();
    };
  }, [token]);

  const handleMarkRead = async (id, refURL) => {
    try {
      await api.markNotificationRead(id, token);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      
      if (refURL) {
        const parts = refURL.split('/tasks/');
        if (parts.length > 1) {
          onSelectTaskID?.(parseInt(parts[1]));
        }
      }
    } catch (err) {
      console.error('Failed marking notification read:', err);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: 'relative',
          padding: '6px 10px',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          background: isOpen ? 'var(--bg-card-hover)' : 'transparent',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        <Bell size={18} />
        {notifications.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '4px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {notifications.length}
          </span>
        )}
      </button>

      {/* Floating Notification Popover Dropdown */}
      {isOpen && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: '42px',
            right: '0',
            width: '320px',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-modal)',
            padding: '12px',
            zIndex: 1100
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
            <span className="badge badge-fuzzy">{notifications.length} unread</span>
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No unread notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                  onClick={() => handleMarkRead(n.id, n.reference_url)}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <AtSign size={14} style={{ color: 'var(--accent-primary)', marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{n.message}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <button title="Mark as read" style={{ color: 'var(--text-muted)' }}>
                    <Check size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Real-Time WebSocket Toast Notification */}
      {toast && (
        <div
          className="card"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid var(--accent-primary)',
            padding: '14px 18px',
            boxShadow: 'var(--shadow-modal)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <MessageSquare size={18} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>REAL-TIME MENTION</span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
            <X size={16} />
          </button>
        </div>
      )}

    </div>
  );
}
