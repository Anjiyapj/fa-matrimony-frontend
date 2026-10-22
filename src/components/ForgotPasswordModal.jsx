import { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { ErrorBox, Modal } from './ui';

export default function ForgotPasswordModal({ open, onClose, defaultEmail = '', onSuccess }) {
  const toast = useToast();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [countdown, setCountdown] = useState(60);

  // Initialize email on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setEmail(defaultEmail && defaultEmail.includes('@') ? defaultEmail.trim() : '');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setErr(null);
      setLoading(false);
    }
  }, [open, defaultEmail]);

  // Resend countdown timer
  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [step, countdown]);

  // Auto-redirect to login after successful password reset
  useEffect(() => {
    if (step !== 4) return;
    const t = setTimeout(() => {
      onClose?.();
    }, 2000);
    return () => clearTimeout(t);
  }, [step, onClose]);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErr(null);
    if (!email.trim() || !email.includes('@')) {
      setErr('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendPasswordResetOtp(email.trim());
      toast(res.message || 'Verification code sent to your email.');
      setCountdown(60);
      setStep(2);
    } catch (e2) {
      setErr(e2.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErr(null);
    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setErr('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyPasswordResetOtp(email.trim(), cleanOtp);
      toast(res.message || 'OTP verified successfully.');
      setStep(3);
    } catch (e2) {
      setErr(e2.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setErr(null);

    if (newPassword.length < 6) {
      setErr('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPasswordWithOtp(email.trim(), otp.trim(), newPassword);
      toast(res.message || 'Password reset successful!');
      setStep(4);
      onSuccess?.(email.trim(), newPassword);
    } catch (e2) {
      setErr(e2.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={500}>
      <div style={{ padding: '24px 20px 20px' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{
            width: 28, height: 28, borderRadius: '50%',
            background: step >= 1 ? '#7c1431' : '#ecd6d6',
            color: step >= 1 ? '#fff' : '#6b5e61',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700
          }}>1</span>
          <span style={{ width: 30, height: 2, background: step >= 2 ? '#7c1431' : '#ecd6d6' }} />
          <span style={{
            width: 28, height: 28, borderRadius: '50%',
            background: step >= 2 ? '#7c1431' : '#ecd6d6',
            color: step >= 2 ? '#fff' : '#6b5e61',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700
          }}>2</span>
          <span style={{ width: 30, height: 2, background: step >= 3 ? '#7c1431' : '#ecd6d6' }} />
          <span style={{
            width: 28, height: 28, borderRadius: '50%',
            background: step >= 3 ? '#7c1431' : '#ecd6d6',
            color: step >= 3 ? '#fff' : '#6b5e61',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700
          }}>3</span>
        </div>

        {/* STEP 1: Enter email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%', background: '#fff0f3',
                color: '#7c1431', display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, marginBottom: 10
              }}>
                <i className="fa-solid fa-key" />
              </div>
              <h2 style={{ fontSize: 20, margin: '0 0 6px', color: '#1f2937' }}>Forgot Password</h2>
              <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                Enter your registered email address. We will send a secure 6-digit OTP verification code.
              </p>
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label htmlFor="reset-email" style={{ fontWeight: 600, fontSize: 13 }}>
                Registered Email Address <span className="rq">*</span>
              </label>
              <div className="input-wrap">
                <input
                  id="reset-email"
                  type="email"
                  className="input"
                  required
                  placeholder="e.g. member@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
                <i className="fa-regular fa-envelope" style={{ color: 'var(--muted)' }} />
              </div>
            </div>

            {err && <ErrorBox error={err} />}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Sending Code…</> : <><i className="fa-regular fa-paper-plane" /> Send Verification Code</>}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Enter OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%', background: '#fff0f3',
                color: '#7c1431', display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, marginBottom: 10
              }}>
                <i className="fa-solid fa-shield-halved" />
              </div>
              <h2 style={{ fontSize: 20, margin: '0 0 6px', color: '#1f2937' }}>Enter Verification Code</h2>
              <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                We sent a 6-digit OTP to <b style={{ color: '#7c1431' }}>{email}</b>.
              </p>
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label htmlFor="otp-input" style={{ fontWeight: 600, fontSize: 13, textAlign: 'center', display: 'block' }}>
                6-Digit Verification Code
              </label>
              <input
                id="otp-input"
                type="text"
                maxLength={6}
                className="input"
                required
                placeholder="• • • • • •"
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: '14px',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  height: 52,
                  borderColor: '#a8123c'
                }}
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(val);
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 14 }}>
              <a href="#back" className="wine" onClick={(e) => { e.preventDefault(); setStep(1); }}>
                <i className="fa-solid fa-arrow-left" /> Change email
              </a>
              {countdown > 0 ? (
                <span className="muted">Resend code in <b>{countdown}s</b></span>
              ) : (
                <a href="#resend" className="wine" style={{ fontWeight: 600 }} onClick={(e) => { e.preventDefault(); handleSendOtp(); }}>
                  <i className="fa-solid fa-rotate-right" /> Resend Code
                </a>
              )}
            </div>

            {err && <ErrorBox error={err} />}

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={loading || otp.trim().length !== 6}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Verifying…</> : <><i className="fa-solid fa-check" /> Verify Code</>}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Set New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%', background: '#fff0f3',
                color: '#7c1431', display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, marginBottom: 10
              }}>
                <i className="fa-solid fa-lock" />
              </div>
              <h2 style={{ fontSize: 20, margin: '0 0 6px', color: '#1f2937' }}>Set New Password</h2>
              <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                Code verified! Enter your new password below (minimum 6 characters).
              </p>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="new-pass" style={{ fontWeight: 600, fontSize: 13 }}>
                New Password <span className="rq">*</span>
              </label>
              <div className="input-wrap">
                <input
                  id="new-pass"
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  required
                  placeholder="Enter new password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
                <i
                  className={showPass ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowPass(!showPass)}
                />
              </div>
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label htmlFor="confirm-pass" style={{ fontWeight: 600, fontSize: 13 }}>
                Confirm New Password <span className="rq">*</span>
              </label>
              <div className="input-wrap">
                <input
                  id="confirm-pass"
                  type={showConfirm ? 'text' : 'password'}
                  className="input"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <i
                  className={showConfirm ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowConfirm(!showConfirm)}
                />
              </div>
              {confirmPassword && (
                <div style={{ fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                  {newPassword === confirmPassword ? (
                    <span style={{ color: '#16a34a' }}><i className="fa-solid fa-circle-check" /> Passwords match</span>
                  ) : (
                    <span style={{ color: '#dc2626' }}><i className="fa-solid fa-circle-xmark" /> Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            {err && <ErrorBox error={err} />}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1.5 }}
                disabled={loading || !newPassword || newPassword !== confirmPassword}
              >
                {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Updating…</> : <><i className="fa-solid fa-check-double" /> Save New Password</>}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Success confirmation */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '16px 0 10px' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4',
              color: '#16a34a', display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 30, marginBottom: 14
            }}>
              <i className="fa-solid fa-circle-check" />
            </div>
            <h2 style={{ fontSize: 21, margin: '0 0 8px', color: '#15803d' }}>Password Reset Successful!</h2>
            <p className="muted" style={{ fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>
              Your account password has been updated. Redirecting you to the login page…
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 20,
              padding: '6px 16px', color: '#7c1431', fontSize: 13, fontWeight: 600,
              marginBottom: 20
            }}>
              <i className="fa-solid fa-spinner fa-spin" /> Redirecting to login…
            </div>
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ height: 46 }}
              onClick={onClose}
            >
              <i className="fa-solid fa-right-to-bracket" /> Go to Login Now
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
