import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('smartops_token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('smartops_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      api.getProfile(token)
        .then((profile) => {
          setUser(profile);
          localStorage.setItem('smartops_user', JSON.stringify(profile));
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (email) => {
    setLoading(true);
    try {
      const data = await api.login(email);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('smartops_token', data.token);
      localStorage.setItem('smartops_user', JSON.stringify(data.user));
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smartops_token');
    localStorage.removeItem('smartops_user');
  };

  const switchRole = async (roleEmail) => {
    return login(roleEmail);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
