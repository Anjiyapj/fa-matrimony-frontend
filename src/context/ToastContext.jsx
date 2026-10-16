import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef();
  const toast = useCallback((content, ms = 2800) => {
    setMsg(content); clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), ms);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={'toast' + (msg ? ' show' : '')} role="status" aria-live="polite">{msg}</div>
    </ToastCtx.Provider>
  );
}
