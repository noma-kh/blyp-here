import React, { createContext, useContext, useMemo, useState } from 'react';
import * as API from './api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    const stored = localStorage.getItem('auth');
    return stored ? JSON.parse(stored) : { user: null, token: null };
  });

  const save = (next) => {
    setState(next);
    localStorage.setItem('auth', JSON.stringify(next));
  };

  const login = async (email, password) => {
    try {
      const data = await API.login(email, password);
      save({ user: data.user, token: data.token });
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const data = await API.signup(name, email, password);
      save({ user: data.user, token: data.token });
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => save({ user: null, token: null });

  const value = useMemo(() => ({ ...state, login, signup, logout }), [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

