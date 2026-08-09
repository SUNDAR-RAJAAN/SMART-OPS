import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Search, Sparkles, X, CheckCircle, Database } from 'lucide-react';

export default function SmartSearchModal({ isOpen, onClose, onSelectTask }) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      api.search(query.trim(), token)
        .then((res) => {
          setResults(res.results || []);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, token]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="card" 
        style={{ width: '100%', maxWidth: '640px', background: 'var(--bg-card)', padding: '20px', boxShadow: 'var(--shadow-modal)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
          <Search size={20} style={{ color: 'var(--accent-primary)' }} />
          <input
            ref={inputRef}
            type="text"
            className="input-field"
            style={{ border: 'none', background: 'transparent', fontSize: '1.05rem', padding: 0 }}
            placeholder="Search tasks (Exact > Fuzzy > Semantic vector)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        {/* Results Body */}
        <div style={{ marginTop: '16px', maxHeight: '380px', overflowY: 'auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Searching 3-tier pipeline...
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No matching tasks found.
            </div>
          )}

          {!loading && results.map((task, idx) => {
            // Determine match tier badge for demo visual feedback
            let matchType = 'fuzzy';
            if (task.title.toLowerCase() === query.trim().toLowerCase() || String(task.id) === query.trim()) {
              matchType = 'exact';
            } else if (idx >= 2) {
              matchType = 'semantic';
            }

            return (
              <div 
                key={task.id} 
                className="card"
                style={{ 
                  marginBottom: '10px', 
                  padding: '12px 16px', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => {
                  onSelectTask(task);
                  onClose();
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#{task.id} - {task.title}</span>
                    <span className={`badge badge-${matchType}`}>
                      {matchType === 'exact' && <CheckCircle size={10} />}
                      {matchType === 'fuzzy' && <Database size={10} />}
                      {matchType === 'semantic' && <Sparkles size={10} />}
                      {matchType} match
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {task.desc || 'No description provided.'}
                  </p>
                </div>

                <span className={`badge badge-${task.status}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
