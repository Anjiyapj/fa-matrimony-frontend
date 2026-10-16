import { Link } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { useToast } from '../../context/ToastContext';
import { adminChanged } from '../../components/AdminLayout';
import { fmt } from '../../lib/utils';
import { Loading } from '../../components/ui';

export default function Married() {
  const toast = useToast();
  const { data: rows, loading, reload } = useAsync(() => api.listMarried(), []);
  const run = async (fn, msg) => { try { await fn(); toast(msg, 3500); reload(); adminChanged(); } catch (e) { toast(e.message, 4000); } };
  const del = (m) => window.confirm(`Delete ${m.name} (${m.id}) permanently?\nTheir profile, photos, likes and messages will be removed.`) && run(() => api.deleteMember(m.id), `${m.name}'s account deleted`);
  const restore = (m) => window.confirm(`Restore ${m.name} to active? Use this only if the marriage was reported by mistake.`) && run(() => api.updateMember(m.id, { status: 'active', marriage: null }), `${m.name} restored to active`);
  const delAll = async () => {
    if (!window.confirm(`Delete all ${rows.length} married accounts permanently?`)) return;
    for (const m of rows) await api.deleteMember(m.id);
    toast(`${rows.length} accounts deleted`); reload(); adminChanged();
  };

  return (
    <section className="panel">
      <div className="panel-h">
        <h2><i className="fa-solid fa-ring" />Married – Awaiting Deletion</h2>
        <div className="tools">
          <span className="muted" style={{ fontSize: 12.5 }}><i className="fa-solid fa-circle-info wine" /> These profiles are already hidden from all members.</span>
          {rows?.length > 1 && <button className="btn btn-outline btn-sm" style={{ color: '#b42318' }} onClick={delAll}><i className="fa-regular fa-trash-can" /> Delete All ({rows.length})</button>}
        </div>
      </div>
      {loading && !rows ? <Loading /> : !rows.length ? <p className="muted" style={{ padding: '24px 0' }}>No married accounts waiting for deletion. 🎉</p> : rows.map((m) => {
        const x = m.marriage || {};
        const partner = x.partnerId && rows.find((r) => r.id === x.partnerId);
        return (
          <div key={m.id} className="q-card">
            <img src={m.photos[0]} alt="" />
            <div>
              <h4><Link to={`/admin/verify/${m.id}`}>{m.name}</Link> <span className="pill s-married">Married</span>{x.viaPlatform && <span className="pill s-active" style={{ marginLeft: 6 }}>Met here 💞</span>}</h4>
              <div className="meta">{m.id} • {m.gender}, {m.age} • {m.diocese} • {m.email}</div>
              <div className="kv-mini">
                <span>Wedding: <b>{fmt(x.date)}</b></span><span>Spouse: <b>{x.spouseName || '—'}</b></span>
                {x.partnerId && <span>Partner profile: <Link className="wine" to={`/admin/verify/${x.partnerId}`}>{x.partnerId}</Link>{partner ? ' (also in this list)' : ''}</span>}
                <span>Reported: <b>{fmt(x.reportedAt)}</b> {x.reportedBy === 'member' ? 'by member' : `by ${x.reportedBy || 'office'}`}</span>
                {x.shareStory && <span><i className="fa-solid fa-heart wine" /> Happy to share story</span>}
              </div>
              {x.note && <div className="reason">“{x.note}”</div>}
            </div>
            <div className="acts">
              <button className="btn btn-primary btn-sm" style={{ background: '#b42318', borderColor: '#b42318' }} onClick={() => del(m)}><i className="fa-regular fa-trash-can" /> Delete Account</button>
              <button className="btn btn-ghost btn-sm" onClick={() => restore(m)}><i className="fa-solid fa-rotate-left" /> Restore (reported by mistake)</button>
              <Link className="btn btn-ghost btn-sm" to={`/admin/verify/${m.id}`}><i className="fa-regular fa-eye" /> Open Profile</Link>
            </div>
          </div>
        );
      })}
    </section>
  );
}
