import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { useToast } from '../../context/ToastContext';
import { adminChanged } from '../../components/AdminLayout';
import { addMonths, fmt } from '../../lib/utils';
import { Loading, Pill } from '../../components/ui';
import { Seg } from './parts';

export default function Holds() {
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const status = sp.get('status') || 'requested';
  const { data: rows, loading, reload } = useAsync(() => api.listHolds(status), [status]);
  const [months, setMonths] = useState({});
  const [notes, setNotes] = useState({});
  const run = async (fn, msg) => { try { await fn(); toast(msg, 3500); reload(); adminChanged(); } catch (e) { toast(e.message, 4000); } };

  return (
    <section className="panel">
      <div className="panel-h">
        <h2><i className="fa-solid fa-circle-pause" />Account Hold</h2>
        <Seg value={status} onChange={(v) => setSp({ status: v })} options={[['requested', 'Requests'], ['active', 'Currently on hold'], ['all', 'History']]} />
        <div className="tools muted" style={{ fontSize: 12.5 }}><i className="fa-solid fa-circle-info wine" /> Approved holds hide the profile and extend the membership by the same period.</div>
      </div>
      {loading && !rows ? <Loading /> : !rows.length ? <p className="muted" style={{ padding: '24px 0' }}>{status === 'requested' ? 'No pending hold requests.' : status === 'active' ? 'No members are on hold right now.' : 'No hold history yet.'}</p> : rows.map((m) => {
        const h = m.hold, mo = months[m.id] ?? h.months;
        return (
          <div key={m.id} className="q-card">
            <img src={m.photos?.[0] || '/img/logo.png'} alt="" />
            <div>
              <h4><Link to={`/admin/verify/${m.id}`}>{m.name}</Link> <Pill status={m.effectiveStatus || m.status || 'on_hold'} /></h4>
              <div className="meta">{m.id} • {m.gender}, {m.age} • {m.diocese} • {m.mobile}</div>
              <div className="kv-mini">
                <span>Requested: <b>{h.months} month{h.months > 1 ? 's' : ''}</b></span>
                {h.requestedAt && <span>On: <b>{fmt(h.requestedAt)}</b></span>}
                <span>Membership till: <b>{fmt(m.expiryDate)}</b></span>
                {h.from && <span>Hold: <b>{fmt(h.from)} → {fmt(h.until)}</b></span>}
                {status === 'all' && <span>Status: <b style={{ textTransform: 'capitalize' }}>{h.status}</b></span>}
              </div>
              {h.reason && <div className="reason"><b>Reason:</b> {h.reason}</div>}
              {h.note && h.status !== 'requested' && <div className="meta">Office note ({h.decidedBy}): {h.note}</div>}
            </div>
            <div className="acts">
              {h.status === 'requested' && (<>
                <select className="select" value={mo} onChange={(e) => setMonths({ ...months, [m.id]: +e.target.value })}>{[1, 2, 3, 4, 5, 6].map((x) => <option key={x} value={x}>Approve for {x} month{x > 1 ? 's' : ''}</option>)}</select>
                <small className="muted">Hidden until {fmt(addMonths(new Date(), mo))}; expiry → {fmt(addMonths(m.expiryDate, mo))}</small>
                <input className="input" placeholder="Note to member (required to reject)" value={notes[m.id] || ''} onChange={(e) => setNotes({ ...notes, [m.id]: e.target.value })} />
                <button className="btn btn-primary btn-sm" onClick={() => run(() => api.decideHold(m.id, { approve: true, months: mo, note: notes[m.id] }), `Hold approved for ${m.name}`)}><i className="fa-solid fa-check" /> Approve Hold</button>
                <button className="btn btn-outline btn-sm" onClick={() => run(() => api.decideHold(m.id, { approve: false, note: (notes[m.id] || '').trim() }), 'Hold request rejected')}><i className="fa-solid fa-xmark" /> Reject</button>
              </>)}
              {(m.status === 'on_hold' || h.status === 'active') && <button className="btn btn-outline btn-sm" onClick={() => window.confirm(`Release ${m.name}'s hold now?`) && run(() => api.releaseHold(m.id), 'Hold released')}><i className="fa-solid fa-play" /> Release Hold</button>}
              <Link className="btn btn-ghost btn-sm" to={`/admin/verify/${m.id}`}><i className="fa-regular fa-eye" /> Open Profile</Link>
            </div>
          </div>
        );
      })}
    </section>
  );
}
