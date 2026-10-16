import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { addMonths, fmt, fmtShort, iso } from '../../lib/utils';
import PageHero from '../../components/PageHero';
import { ErrorBox, Gallery, Loading, Modal, Notice, Pill } from '../../components/ui';
import { BASE_TABS, ProfileHeader, SideCards, TabPanel, Tabs } from '../../components/ProfileParts';

const NOTE_ICON = { approved: 'fa-solid fa-circle-check', hold: 'fa-solid fa-circle-pause', renewal: 'fa-regular fa-bell', renewed: 'fa-solid fa-rotate' };

export default function MyProfile() {
  const { hash, search } = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const { refresh, clearSession, logout } = useAuth();
  const { data: m, loading, error, reload } = useAsync(() => api.getMyProfile(), []);
  const [tab, setTab] = useState(hash === '#account' || search.includes('hold=1') ? 'account' : 'basic');
  useEffect(() => { if (hash === '#account') { setTab('account'); setTimeout(() => document.getElementById('acct')?.scrollIntoView({ behavior: 'smooth' }), 200); } }, [hash]);
  useEffect(() => { if (m?.notifications?.some((n) => !n.read)) api.markNotificationsRead().catch(() => {}); }, [m]);

  const after = async (msg) => { toast(msg, 3800); await refresh(); reload(); };

  const hero = <PageHero crumbs={[['Home', '/'], ['My Profile']]} title="My Profile" sub="This is how other members see your profile." verse="Two are better than one, for if they fall, one will lift up the other." verseRef="ECCLESIASTES 4:9" />;
  if (loading && !m) return <main className="page">{hero}<Loading /></main>;
  if (error) return <main className="page">{hero}<div className="container"><ErrorBox error={error} /></div></main>;

  const onHold = m.status === 'on_hold';
  return (
    <main className="page">
      {hero}
      <div className="container pd-layout">
        <aside className="card pd-left">
          <Gallery member={m} badge={onHold ? 'On Hold' : 'Verified'} />
          {onHold
            ? <Notice type="" icon="fa-solid fa-circle-pause" style={{ marginTop: 12, background: '#eef3fd', borderColor: '#c9d7f3', color: '#22427d' }}>Account on hold until <b>{fmt(m.hold.until)}</b>. Your profile is hidden.</Notice>
            : <Notice type="ok" icon="fa-solid fa-circle-check" style={{ marginTop: 12 }}>Subscription active till <b>{fmt(m.expiryDate)}</b> ({m.daysLeft} days left)</Notice>}
          {!onHold && <>
            <Link to="/match" className="btn btn-primary"><i className="fa-solid fa-heart" /> Find Matches</Link>
            <Link to="/chat" className="btn btn-outline"><i className="fa-regular fa-comments" /> My Messages ({m.stats.matches})</Link>
          </>}
          <button className="btn btn-outline" onClick={() => setTab('account')}><i className="fa-solid fa-gear" /> Account &amp; Hold</button>
          <button className="btn btn-outline" onClick={async () => { await logout(); nav('/login'); }}><i className="fa-solid fa-right-from-bracket" /> Logout</button>
        </aside>

        <section className="pd-mid">
          {onHold && (
            <div className="hold-banner">
              <i className="fa-solid fa-circle-pause big" />
              <div><h3>Your account is on hold</h3><p>From {fmt(m.hold.from)} to {fmt(m.hold.until)}. Your profile is hidden from other members, and your membership has been extended to {fmt(m.expiryDate)}.</p></div>
              <ResumeButton onDone={after} />
            </div>
          )}
          <div className="card" style={{ paddingBottom: 0 }}>
            <ProfileHeader m={m} />
            <Tabs tabs={[...BASE_TABS, ['account', 'fa-solid fa-gear', 'Account & Hold']]} tab={tab} setTab={setTab} />
          </div>
          <div className="card" id="acct">
            {tab === 'account' ? <AccountPanel m={m} onChanged={after} onMarried={() => { clearSession(); nav('/stories'); toast('Congratulations and God bless your family! 💍 Your profile is now hidden and the office will remove your account.', 6000); }} /> : <TabPanel m={m} tab={tab} />}
          </div>
          <div className="card about-me" style={{ margin: 0, padding: '12px 18px' }}><i className="fa-solid fa-file-lines" /><div><h4>About Me</h4>{m.about || <span className="muted">Not added yet.</span>}</div></div>
        </section>

        <SideCards m={m} self extra={<>
          <div className="card"><h3 className="card-title"><i className="fa-regular fa-bell" />From the Office</h3>
            {m.notifications.length ? <ul className="notif">{m.notifications.map((n) => <li key={n.id}><i className={NOTE_ICON[n.type] || 'fa-regular fa-envelope'} /><div>{n.text}<small>{fmtShort(n.at)}</small></div></li>)}</ul>
              : <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>No messages yet.</p>}</div>
          <div className="card quick-info"><h3 className="card-title"><i className="fa-solid fa-gear" />Quick Info</h3>
            <div className="row"><i className="fa-regular fa-id-badge" /><span className="muted">Profile ID</span><span>{m.id}</span></div>
            <div className="row"><i className="fa-solid fa-circle-half-stroke" /><span className="muted">Status</span><span><Pill status={m.status} /></span></div>
            <div className="row"><i className="fa-regular fa-calendar" /><span className="muted">Member Since</span><span>{fmt(m.approvedDate || m.regDate)}</span></div>
            <div className="row"><i className="fa-regular fa-clock" /><span className="muted">Valid Till</span><span>{fmt(m.expiryDate)}</span></div>
            <div className="row"><i className="fa-regular fa-eye" /><span className="muted">Profile Views</span><span>{m.views || 0}</span></div>
            <div className="row"><i className="fa-solid fa-heart" /><span className="muted">Liked You</span><span>{m.stats.likedMe}</span></div>
          </div></>} />
      </div>
    </main>
  );
}

function ResumeButton({ onDone }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <button className="btn btn-primary" disabled={busy} onClick={async () => {
      if (!window.confirm('Resume your account now? Your profile becomes visible again, and the unused hold days are removed from your extended membership.')) return;
      setBusy(true); try { await api.resumeFromHold(); onDone('Welcome back! Your profile is visible again.'); } catch (e) { toast(e.message); } finally { setBusy(false); }
    }}><i className="fa-solid fa-play" /> Resume Now</button>
  );
}

/* ---------------- Account & Hold tab ---------------- */
function AccountPanel({ m, onChanged, onMarried }) {
  const toast = useToast();
  const { data: look } = useAsync(() => api.getLookups(), []);
  const opts = look?.settings?.holdOptions || [1, 2, 3, 6];
  const [months, setMonths] = useState(2);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [marriedOpen, setMarriedOpen] = useState(false);
  const h = m.hold;
  const run = async (fn, msg) => { setBusy(true); try { await fn(); await onChanged(msg); } catch (e) { toast(e.message, 4000); } finally { setBusy(false); } };
  const canRequest = ['active', 'expiring'].includes(m.status) && h?.status !== 'requested';

  return (
    <>
      <h3 className="pane-title"><i className="fa-solid fa-gear" />Account &amp; Hold</h3>
      <div className="acct-grid" style={{ marginTop: 8 }}>
        <div className="acct-card">
          <h4><i className="fa-solid fa-circle-pause" />Pause my account (Hold)</h4>
          {m.status === 'on_hold' ? (<>
            <p>Your account is on hold from <b>{fmt(h.from)}</b> to <b>{fmt(h.until)}</b> ({h.months} month{h.months > 1 ? 's' : ''}). Your profile is hidden and your membership is extended to <b>{fmt(m.expiryDate)}</b>.</p>
            {h.note && <Notice icon="fa-regular fa-comment" style={{ marginBottom: 12 }}>Office: {h.note}</Notice>}
            <ResumeButton onDone={onChanged} />
          </>) : h?.status === 'requested' ? (<>
            <Notice icon="fa-regular fa-hourglass-half" style={{ marginBottom: 12 }}>Hold request for <b>{h.months} month{h.months > 1 ? 's' : ''}</b> sent on {fmt(h.requestedAt)} – waiting for approval from the Family Apostolate office.</Notice>
            {h.reason && <p><b>Reason:</b> {h.reason}</p>}
            <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => run(() => api.cancelHoldRequest(), 'Hold request cancelled')}><i className="fa-solid fa-xmark" /> Cancel Request</button>
          </>) : (<>
            <p>Need a break – studies, work abroad, a family situation? Ask the office to hold your account. While on hold your profile is hidden, and your membership is <b>extended by the same period</b>, so you don’t lose subscription days.</p>
            {h?.status === 'rejected' && <Notice type="err" icon="fa-solid fa-circle-exclamation" style={{ marginBottom: 12 }}>Your last request ({fmt(h.requestedAt)}) was not approved: {h.note}</Notice>}
            {h?.status === 'ended' && <Notice type="ok" icon="fa-solid fa-circle-check" style={{ marginBottom: 12 }}>Your last hold ended on {fmt(h.until)}.</Notice>}
            {canRequest ? (<>
              <div className="field"><label>Hold period</label>
                <div className="choice-row">{opts.map((o) => <label key={o}><input type="radio" name="hold" checked={months === o} onChange={() => setMonths(o)} /><span>{o} month{o > 1 ? 's' : ''}</span></label>)}</div></div>
              <p className="muted" style={{ fontSize: 12.5, margin: '8px 0' }}>If approved today: hidden until <b>{fmt(addMonths(new Date(), months))}</b>, membership extended to <b>{fmt(addMonths(m.expiryDate, months))}</b>.</p>
              <div className="field"><label>Reason (for the office)</label><textarea className="input" rows="2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Going abroad for higher studies" /></div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} disabled={busy} onClick={() => run(() => api.requestHold({ months, reason }), 'Hold request sent to the Family Apostolate office')}><i className="fa-solid fa-paper-plane" /> Request Hold</button>
            </>) : <p className="muted">Hold is available only for active memberships.</p>}
          </>)}
        </div>

        <div className="acct-card">
          <h4><i className="fa-solid fa-ring" />I got married</h4>
          <p>Praise the Lord! Let us know so we can close your account. Your profile is <b>hidden immediately</b>, and the office will delete your account after checking. You can also share your success story.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setMarriedOpen(true)}><i className="fa-solid fa-heart" /> Update Marriage Status</button>
          <hr style={{ border: 0, borderTop: '1px dashed var(--line)', margin: '18px 0' }} />
          <h4 style={{ fontSize: 17 }}><i className="fa-solid fa-id-card" />Membership</h4>
          <p style={{ marginBottom: 6 }}>Plan: 6 months – ₹ 500 • Valid till <b>{fmt(m.expiryDate)}</b>{m.status !== 'on_hold' && <> ({m.daysLeft} days left)</>}</p>
          <p className="muted" style={{ fontSize: 12.5 }}>To renew or change your details, please <Link className="wine" to="/contact?subject=Renewal">contact the office</Link> – changes are re-verified.</p>
        </div>
      </div>
      <MarriedModal open={marriedOpen} onClose={() => setMarriedOpen(false)} me={m} onDone={onMarried} />
    </>
  );
}

function MarriedModal({ open, onClose, me, onDone }) {
  const toast = useToast();
  const { data: matches } = useAsync(() => (open && me.status !== 'on_hold' ? api.getMatches().catch(() => []) : Promise.resolve([])), [open]);
  const [f, setF] = useState({ date: iso(new Date()), spouseName: '', viaPlatform: 'no', partnerId: '', shareStory: true, note: '', confirm: false });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const pickPartner = (e) => { const id = e.target.value; const p = matches?.find((x) => x.member.id === id); setF({ ...f, partnerId: id, spouseName: p ? p.member.name : f.spouseName }); };
  const submit = async (e) => {
    e.preventDefault();
    if (!f.confirm) return toast('Please tick the confirmation box');
    setBusy(true);
    try { await api.reportMarried({ date: f.date, spouseName: f.spouseName, viaPlatform: f.viaPlatform === 'yes', partnerId: f.viaPlatform === 'yes' ? f.partnerId : null, shareStory: f.shareStory, note: f.note }); onDone(); }
    catch (e2) { toast(e2.message, 4000); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} width={620}>
      <form onSubmit={submit}>
        <h3><i className="fa-solid fa-ring" /> Update Marriage Status</h3>
        <p className="muted" style={{ fontSize: 13.5, marginTop: -6, marginBottom: 14 }}>Congratulations! After you submit, your profile is hidden at once and your login is closed. The Family Apostolate office will delete your account.</p>
        <div className="grid g2">
          <div className="field"><label>Wedding Date <span className="rq">*</span></label><input className="input" type="date" required value={f.date} onChange={set('date')} max={iso(addMonths(new Date(), 12))} /></div>
          <div className="field"><label>Married through this platform?</label>
            <div className="choice-row"><label><input type="radio" checked={f.viaPlatform === 'yes'} onChange={() => setF({ ...f, viaPlatform: 'yes' })} /><span>Yes</span></label><label><input type="radio" checked={f.viaPlatform === 'no'} onChange={() => setF({ ...f, viaPlatform: 'no', partnerId: '' })} /><span>No</span></label></div></div>
          {f.viaPlatform === 'yes' && matches?.length > 0 && (
            <div className="field"><label>Your partner (from your matches)</label><select className="select" value={f.partnerId} onChange={pickPartner}><option value="">Select</option>{matches.map(({ member: p }) => <option key={p.id} value={p.id}>{p.name} – {p.id}</option>)}</select></div>
          )}
          <div className="field"><label>Spouse Name <span className="rq">*</span></label><input className="input" required value={f.spouseName} onChange={set('spouseName')} placeholder="Full name" /></div>
        </div>
        <div className="field" style={{ marginTop: 14 }}><label>Message to the office (optional)</label><textarea className="input" rows="3" value={f.note} onChange={set('note')} placeholder="Anything you would like to share…" /></div>
        <label className="check" style={{ marginTop: 12, fontSize: 14 }}><input type="checkbox" checked={f.shareStory} onChange={set('shareStory')} /> I’m happy for the office to contact us about sharing our success story</label>
        <label className="check" style={{ marginTop: 8, fontSize: 14 }}><input type="checkbox" checked={f.confirm} onChange={set('confirm')} /> I confirm I am married and want my profile removed <span className="rq">*</span></label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}><i className="fa-solid fa-ring" /> {busy ? 'Submitting…' : 'Submit & Close My Profile'}</button>
        </div>
      </form>
    </Modal>
  );
}
