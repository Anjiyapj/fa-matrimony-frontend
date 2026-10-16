import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);
const TOKEN_KEY = 'fa_token';

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, role: null, user: null });
  const [summary, setSummary] = useState(null);
  const location = useLocation();

  const refresh = useCallback(async () => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) { setState({ loading: false, role: null, user: null }); return; }
    api.setToken(t);
    try { const r = await api.me(); setState({ loading: false, role: r.role, user: r.user }); }
    catch (e) { localStorage.removeItem(TOKEN_KEY); api.setToken(null); setState({ loading: false, role: null, user: null }); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  // header bell: unread messages + people who liked you + office notices
  const refreshSummary = useCallback(() => {
    if (state.role === 'member' && state.user?.status !== 'on_hold') api.getSummary().then(setSummary).catch(() => setSummary(null));
    else setSummary(null);
  }, [state.role, state.user?.status]);
  useEffect(() => { refreshSummary(); }, [refreshSummary, location.pathname]);

  const login = async (creds) => {
    const r = await api.login(creds);
    localStorage.setItem(TOKEN_KEY, r.token); api.setToken(r.token);
    setState({ loading: false, role: r.role, user: r.user });
    return r;
  };
  const logout = async () => {
    try { await api.logout(); } catch (e) { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY); api.setToken(null);
    setState({ loading: false, role: null, user: null }); setSummary(null);
  };
  // after the member reports marriage the server ends the session
  const clearSession = () => { localStorage.removeItem(TOKEN_KEY); api.setToken(null); setState({ loading: false, role: null, user: null }); };

  return (
    <AuthCtx.Provider value={{ ...state, isMember: state.role === 'member', isAdmin: state.role === 'admin', summary, refreshSummary, login, logout, refresh, clearSession }}>
      {children}
    </AuthCtx.Provider>
  );
}
