import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fmt, addMonths, today, toDate } from '../../lib/utils';
import PageHero from '../../components/PageHero';
import { ErrorBox, Notice, Pill } from '../../components/ui';

export default function Renewal() {
  const nav = useNavigate();
  const toast = useToast();
  const { user, refresh } = useAuth();

  const [paymentMode, setPaymentMode] = useState('UPI');
  const [txnInput, setTxnInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Calculate new expiry date (+6 months)
  const currentExpiry = user?.expiryDate ? toDate(user.expiryDate) : null;
  const isExpired = !currentExpiry || currentExpiry < today();
  const baseDate = (!isExpired && currentExpiry) ? currentExpiry : today();
  const projectedExpiry = addMonths(baseDate, 6);

  const daysLeft = user?.daysLeft !== undefined && user?.daysLeft !== null
    ? user.daysLeft
    : (currentExpiry ? Math.max(0, Math.ceil((currentExpiry - today()) / 864e5)) : 0);

  const upiId = 'jcs@jecc.ac.in';

  const copyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast('UPI ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRenew = async (e) => {
    if (e) e.preventDefault();
    setErr(null);
    setBusy(true);

    try {
      const generatedTxn = txnInput.trim() || ('REN' + Date.now().toString().slice(-6));
      const res = await api.renew({
        mode: paymentMode,
        txn: generatedTxn,
        amount: 500
      });

      setSuccessData({
        expiryDate: res.expiryDate,
        txn: res.txn || generatedTxn,
        amount: 500,
        email: user?.email
      });

      toast('Plan renewed successfully for 6 months! ✝');
      await refresh();
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page" style={{ paddingBottom: 50 }}>
      <PageHero
        crumbs={[['Home', '/'], ['My Profile', '/my-profile'], ['Plan Renewal']]}
        title="Membership Renewal"
        sub="Extend your subscription by 6 months to continue finding your Catholic life partner."
        verse="I will give you a new heart and put a new spirit in you."
        verseRef="EZEKIEL 36:26"
      />

      <div className="container" style={{ maxWidth: 860, marginTop: 24 }}>
        {err && <ErrorBox error={err} style={{ marginBottom: 20 }} />}

        {successData ? (
          /* Success Receipt Card */
          <div className="card" style={{ padding: '36px 30px', textAlign: 'center', borderTop: '4px solid #15803d' }}>
            <div style={{
              width: 72,
              height: 72,
              lineHeight: '72px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#15803d',
              fontSize: 34,
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(21,128,61,0.18)'
            }}>
              <i className="fa-solid fa-circle-check" />
            </div>

            <h2 style={{ fontSize: 26, color: '#14532d', marginBottom: 8 }}>
              Subscription Successfully Renewed!
            </h2>
            <p style={{ color: '#4b5563', fontSize: 15, maxWidth: 540, margin: '0 auto 24px' }}>
              Your Family Apostolate Matrimony profile is now <b>Active</b> for another 6 months. An official confirmation receipt has been emailed to <b>{successData.email}</b>.
            </p>

            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 14,
              padding: '20px 24px',
              maxWidth: 480,
              margin: '0 auto 28px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Member ID</span>
                <span style={{ fontWeight: 600 }}>{user?.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Subscriber Name</span>
                <span style={{ fontWeight: 600 }}>{user?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Plan Extension</span>
                <span style={{ fontWeight: 600, color: '#15803d' }}>+ 6 Months</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>New Expiry Date</span>
                <span style={{ fontWeight: 700, color: '#7c1431' }}>{fmt(successData.expiryDate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Amount Paid</span>
                <span style={{ fontWeight: 700 }}>₹{successData.amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#6b7280' }}>Transaction Ref</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{successData.txn}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/match" className="btn btn-primary" style={{ padding: '12px 26px', fontSize: 15 }}>
                <i className="fa-solid fa-heart" /> Explore Matches
              </Link>
              <Link to="/my-profile" className="btn btn-outline" style={{ padding: '12px 24px', fontSize: 15 }}>
                <i className="fa-regular fa-user" /> View My Profile
              </Link>
            </div>
          </div>
        ) : (
          /* Active Renewal Form */
          <div>
            {/* Status Header Banner */}
            {isExpired ? (
              <div className="notice err" style={{ marginBottom: 20, padding: '14px 18px', fontSize: 15 }}>
                <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 20 }} />
                <span>
                  <b>Your membership subscription has expired.</b> Your profile is currently hidden from matchmaking search. Click <b>"Renew Plan"</b> below to instantly reactivate your profile and messaging access.
                </span>
              </div>
            ) : daysLeft <= 15 ? (
              <div className="notice warn" style={{ marginBottom: 20, padding: '14px 18px', fontSize: 15, background: '#fffbeb', borderColor: '#fef3c7', color: '#92400e' }}>
                <i className="fa-regular fa-bell" style={{ fontSize: 20, color: '#d97706' }} />
                <span>
                  <b>Your subscription expires in {daysLeft} day{daysLeft === 1 ? '' : 's'} ({fmt(user?.expiryDate)}).</b> Renew today to ensure continuous communication and visibility without interruption.
                </span>
              </div>
            ) : (
              <Notice type="ok" icon="fa-solid fa-circle-check" style={{ marginBottom: 20 }}>
                Your membership is active till <b>{fmt(user?.expiryDate)}</b> ({daysLeft} days remaining). You can extend your plan by another 6 months at any time.
              </Notice>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              
              {/* Left Column: Plan Summary Card */}
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7c1431', fontWeight: 700 }}>
                      Archdiocese of Thrissur
                    </span>
                    <Pill status={user?.status} />
                  </div>

                  <h3 style={{ fontSize: 22, margin: '0 0 4px', color: '#1f2937' }}>6 Months Standard Plan</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '10px 0 16px' }}>
                    <span style={{ fontSize: 34, fontWeight: 800, color: '#7c1431' }}>₹500</span>
                    <span style={{ color: '#6b7280', fontSize: 14 }}>/ 6 months validity</span>
                  </div>

                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6 }}>
                      <span className="muted">Member ID:</span>
                      <span style={{ fontWeight: 600 }}>{user?.id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6 }}>
                      <span className="muted">Current Expiry:</span>
                      <span style={{ fontWeight: 500, color: isExpired ? '#dc2626' : 'inherit' }}>
                        {fmt(user?.expiryDate)} {isExpired ? '(Expired)' : `(${daysLeft}d left)`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingTop: 6, borderTop: '1px dashed #e5e7eb' }}>
                      <span style={{ fontWeight: 600, color: '#15803d' }}>New Expiry Date:</span>
                      <span style={{ fontWeight: 700, color: '#15803d' }}>{fmt(projectedExpiry)}</span>
                    </div>
                  </div>

                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: '14px 0 10px', color: '#374151' }}>
                    Features Included with Renewal:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13.5, color: '#4b5563' }}>
                    <li style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-circle-check" style={{ color: '#15803d', fontSize: 14 }} />
                      Full Catholic directory search &amp; filters
                    </li>
                    <li style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-circle-check" style={{ color: '#15803d', fontSize: 14 }} />
                      Direct mutual messaging &amp; chat
                    </li>
                    <li style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-circle-check" style={{ color: '#15803d', fontSize: 14 }} />
                      Phone &amp; email contact unlock on mutual interest
                    </li>
                    <li style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-circle-check" style={{ color: '#15803d', fontSize: 14 }} />
                      Active listing in Catholic parish registers
                    </li>
                    <li style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-circle-check" style={{ color: '#15803d', fontSize: 14 }} />
                      Archdiocesan Family Apostolate verification badge
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Payment & Action Card */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 18, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fa-solid fa-credit-card" style={{ color: '#7c1431' }} />
                  Select Payment Method
                </h3>

                {/* Tabs */}
                <div className="login-tabs" style={{ marginBottom: 18 }}>
                  <button
                    type="button"
                    className={paymentMode === 'UPI' ? 'on' : ''}
                    onClick={() => setPaymentMode('UPI')}
                  >
                    <i className="fa-solid fa-qrcode" /> UPI / QR Code
                  </button>
                  <button
                    type="button"
                    className={paymentMode === 'Office' ? 'on' : ''}
                    onClick={() => setPaymentMode('Office')}
                  >
                    <i className="fa-solid fa-building-columns" /> Office Counter
                  </button>
                </div>

                {paymentMode === 'UPI' ? (
                  <div style={{ background: '#faf6f7', border: '1px solid #f1e4e6', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Family Apostolate UPI ID:</span>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={copyUpi}
                        style={{ padding: '3px 10px', fontSize: 12 }}
                      >
                        <i className={copied ? 'fa-solid fa-check' : 'fa-regular fa-copy'} /> {copied ? 'Copied' : 'Copy UPI'}
                      </button>
                    </div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#7c1431',
                      background: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px dashed #d1a4ad',
                      marginBottom: 12
                    }}>
                      {upiId}
                    </div>

                    <p style={{ fontSize: 12.5, color: '#6b7280', margin: '0 0 12px', lineHeight: 1.4 }}>
                      Scan via GPay, PhonePe, Paytm or BHIM UPI, transfer <b>₹500</b>, and enter the reference number below (or click Renew to activate immediately).
                    </p>

                    <div className="field">
                      <label htmlFor="txn" style={{ fontSize: 13 }}>
                        UPI Reference / UTR Number <small style={{ color: '#9ca3af' }}>(Optional)</small>
                      </label>
                      <input
                        id="txn"
                        className="input"
                        placeholder="e.g. 429182749102 or leave blank"
                        value={txnInput}
                        onChange={(e) => setTxnInput(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 18, fontSize: 13.5, color: '#475569' }}>
                    <h4 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: 14 }}>
                      <i className="fa-solid fa-location-dot" style={{ color: '#7c1431', marginRight: 6 }} />
                      Archbishop's House Matrimony Office
                    </h4>
                    <p style={{ margin: '0 0 8px', lineHeight: 1.5 }}>
                      Archbishop's House, Post Box No. 706,<br />
                      Thrissur – 680 005, Kerala, India.<br />
                      Office Hours: Monday – Saturday (9:30 AM – 4:30 PM)
                    </p>
                    <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
                      Cash or Cheque counter payments are acknowledged immediately. Click Renew below to submit your renewal notice.
                    </p>
                  </div>
                )}

                {/* Renew Button */}
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  style={{ height: 50, fontSize: 16, fontWeight: 700, letterSpacing: 0.3 }}
                  disabled={busy}
                  onClick={handleRenew}
                >
                  {busy ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" /> Renewing Membership…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-rotate" /> Renew Plan Now (₹500)
                    </>
                  )}
                </button>

                <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
                  <i className="fa-solid fa-shield-halved" style={{ marginRight: 4 }} />
                  Official renewal by Family Apostolate Archdiocese of Thrissur
                </p>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}
