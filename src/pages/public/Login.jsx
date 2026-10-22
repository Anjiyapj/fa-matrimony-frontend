import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ErrorBox, Notice } from '../../components/ui';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';

export default function Login() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { login, isMember, isAdmin, user, logout } = useAuth();
  const [role, setRole] = useState(sp.get('role') === 'admin' ? 'admin' : 'member');
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState(null);
  const next = sp.get('next');

  const submit = async (e) => {
    e.preventDefault(); setErr(null); setResetSuccessMsg(null); setBusy(true);
    try {
      const r = await login({ username, password, role });
      if (r.role === 'member') {
        const u = r.user || {};
        const isExpiring = u.status === 'expired' || u.status === 'expiring' || (u.daysLeft !== null && u.daysLeft !== undefined && u.daysLeft <= 15);
        if (isExpiring) {
          nav('/renewal', { replace: true });
          return;
        }
      }
      const ok = next && (r.role === 'admin' ? next.startsWith('/admin') : !next.startsWith('/admin'));
      nav(ok ? next : r.role === 'admin' ? '/admin' : '/my-profile', { replace: true });
    } catch (e2) { setErr(e2); } finally { setBusy(false); }
  };
  const pickRole = (r) => { setRole(r); setErr(null); setResetSuccessMsg(null); };

  return (
    <main className="page" style={{ padding: '10px 0 40px' }}>
      <div className="card login-wrap">
        <div className="login-art"><q>Two are better than one, for if they fall, one will lift up the other.</q><small>ECCLESIASTES 4:9</small></div>
        <form className="login-form" onSubmit={submit} noValidate>
          <h2>{role === 'admin' ? 'Admin Login' : 'Welcome Back'}</h2>
          <p className="muted">{role === 'admin' ? 'Family Apostolate office – manage registrations and reports.' : 'Log in to continue your faith-filled journey.'}</p>
          <div className="login-tabs">
            <button type="button" className={role === 'member' ? 'on' : ''} onClick={() => pickRole('member')}><i className="fa-regular fa-heart" /> Member</button>
            <button type="button" className={role === 'admin' ? 'on' : ''} onClick={() => pickRole('admin')}><i className="fa-solid fa-user-shield" /> Admin</button>
          </div>
          {resetSuccessMsg && (
            <Notice type="ok" icon="fa-solid fa-circle-check" style={{ marginTop: 14 }}>
              {resetSuccessMsg}
            </Notice>
          )}
          {(isMember || isAdmin) && !next && (
            <Notice type="ok" icon="fa-solid fa-circle-check" style={{ marginTop: 14 }}>You are logged in as <b>{user.name}</b>. <Link className="wine" to={isAdmin ? '/admin' : '/my-profile'} style={{ fontWeight: 600 }}>Continue</Link> or <a href="#out" className="wine" onClick={(e) => { e.preventDefault(); logout(); }}>log out</a>.</Notice>
          )}
          <div className="grid">
            <div className="field"><label htmlFor="user">{role === 'admin' ? 'Admin Username' : 'Email or Mobile Number'} <span className="rq">*</span></label>
              <input id="user" className="input" required value={username} onChange={(e) => setU(e.target.value)} placeholder={role === 'admin' ? 'Enter admin username' : 'Enter email or mobile number'} autoComplete="username" /></div>
            <div className="field"><label htmlFor="pass">Password <span className="rq">*</span></label>
              <div className="input-wrap"><input id="pass" className="input" type={show ? 'text' : 'password'} required value={password} onChange={(e) => setP(e.target.value)} placeholder="Enter password" autoComplete="current-password" />
                <i className={show ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'} onClick={() => setShow(!show)} style={{ cursor: 'pointer' }} /></div></div>
          </div>
          {err && <ErrorBox error={err} />}
          <div className="row">
            <label className="check" style={{ fontSize: 13.5 }}><input type="checkbox" defaultChecked /> Remember me</label>
            <a
              href="#forgot-password"
              className="wine"
              style={{ fontWeight: 500, cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                setForgotOpen(true);
              }}
            >
              Forgot password?
            </a>
          </div>
          <button className="btn btn-primary btn-block" style={{ height: 48 }} disabled={busy}><i className="fa-solid fa-right-to-bracket" /> {busy ? 'Logging in…' : 'Login'}</button>
          {role === 'member' && <p style={{ textAlign: 'center', marginTop: 18, fontSize: 14 }}>New to Family Apostolate Matrimony? <Link to="/register" className="wine" style={{ fontWeight: 600 }}>Register Now</Link></p>}
        </form>
      </div>

      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        defaultEmail={username}
        onSuccess={(userEmail, newPass) => {
          setU(userEmail);
          setP(newPass);
          setForgotOpen(false);
          setResetSuccessMsg(`Password for ${userEmail} was reset successfully! Click Login to continue.`);
          nav('/login', { replace: true });
        }}
      />
    </main>
  );
}
