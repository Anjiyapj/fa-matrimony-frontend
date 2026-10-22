import { Link, useOutletContext } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { useToast } from '../../context/ToastContext';
import { fmt } from '../../lib/utils';
import { Loading, Pill } from '../../components/ui';
import { Legend, TrendBars } from './parts';

export default function Dashboard() {
  const { summary: s } = useOutletContext();
  const toast = useToast();
  const { data: trend } = useAsync(() => api.trend(7).catch(() => []), []);
  const { data: recent } = useAsync(() => api.listMembers({ sort: 'new' }).catch(() => []), []);
  const { data: expiring, reload } = useAsync(async () => {
    const [expList = [], expdList = []] = await Promise.all([
      api.listMembers({ status: 'expiring' }).catch(() => []),
      api.listMembers({ status: 'expired' }).catch(() => [])
    ]);
    return [...(expList || []), ...(expdList || [])].sort((a, b) => (a?.expiryDate || '').localeCompare(b?.expiryDate || ''));
  }, []);
  if (!s) return <Loading />;
  const c = s.counts;
  const notify = async (ids) => {
    try {
      const r = await api.notifyRenewal(ids);
      toast(`Renewal reminder sent to ${r.sent} member${r.sent === 1 ? '' : 's'} (portal, email & SMS)`);
      reload();
    } catch (err) {
      toast(err?.message || 'Failed to send notification', 4000);
    }
  };
  const K = [
    ['/admin/members', 'fa-solid fa-users', '', s.total, 'Total Registrations', `+${s.newThisMonth} this month`],
    ['/admin/members?status=pending', 'fa-solid fa-hourglass-half', 'k-amber', c.pending || 0, 'Pending Approval'],
    ['/admin/members?status=active', 'fa-solid fa-user-check', 'k-green', (c.active || 0) + (c.expiring || 0), 'Active Members'],
    ['/admin/members?status=expiring', 'fa-solid fa-bell', 'k-gold', c.expiring || 0, 'Expiring ≤ 15 days'],
    ['/admin/holds?status=active', 'fa-solid fa-circle-pause', 'k-blue', c.on_hold || 0, 'On Hold'],
    ['/admin/members?status=expired', 'fa-solid fa-user-slash', 'k-gray', (c.expired || 0) + (c.rejected || 0), 'Inactive (Expired / Rejected)'],
    ['/admin/married', 'fa-solid fa-ring', '', c.married || 0, 'Married – to delete']
  ];
  return (
    <>
      <div className="kpis k7">
        {K.map(([to, ic, cls, n, label, em]) => <Link key={label} to={to} className={'kpi ' + cls}><span className="ico"><i className={ic} /></span><b>{n}</b><span>{label}</span>{em && <em className="up">{em}</em>}</Link>)}
      </div>

      <section className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-h">
          <h2><i className="fa-solid fa-list-check" />Needs Your Attention</h2>
          <div className="tools">
            <Link className="btn btn-outline btn-sm" to="/admin/stories">
              <i className="fa-solid fa-heart wine" /> Success Stories ({s.totalStories || 0})
            </Link>
          </div>
        </div>
        <div className="queue-links q4">
          <Link to="/admin/members?status=pending"><span className="ico"><i className="fa-solid fa-user-check" /></span><div><b>{c.pending || 0}</b><span className="t">Registrations to verify</span></div></Link>
          <Link to="/admin/holds"><span className="ico"><i className="fa-solid fa-circle-pause" /></span><div><b>{s.holdRequests}</b><span className="t">Hold requests</span></div></Link>
          <Link to="/admin/married"><span className="ico"><i className="fa-solid fa-ring" /></span><div><b>{s.marriedToDelete}</b><span className="t">Married – delete accounts</span></div></Link>
          <Link to="/admin/enquiries"><span className="ico"><i className="fa-regular fa-envelope" /></span><div><b>{s.openEnquiries}</b><span className="t">Open enquiries</span></div></Link>
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-h"><h2><i className="fa-solid fa-chart-column" />Membership – Last 7 Months</h2><div className="tools"><Legend /><Link className="btn btn-outline btn-sm" to="/admin/reports">Full Report <i className="fa-solid fa-arrow-right" /></Link></div></div>
          {trend ? <TrendBars data={trend} height={280} /> : <Loading />}
        </section>
        <section className="panel">
          <div className="panel-h"><h2><i className="fa-regular fa-bell" />Renewals Due</h2><div className="tools"><button className="btn btn-primary btn-sm" disabled={!expiring?.length} onClick={() => notify((expiring || []).map((m) => m.id))}><i className="fa-regular fa-paper-plane" /> Notify All {expiring?.length ? `(${expiring.length})` : ''}</button></div></div>
          {!expiring ? <Loading /> : expiring.length === 0 ? <p className="muted" style={{ padding: '20px 0' }}>No subscriptions expiring in the next 15 days.</p> : expiring.slice(0, 7).map((m) => (
            <div key={m.id} className="exp-item"><img src={m.photos?.[0] || '/img/logo.png'} alt="" /><div><b>{m.name}</b><small>{m.daysLeft < 0 ? 'Expired' : 'Expires'} {fmt(m.expiryDate)}</small></div>
              <div className="days" style={m.daysLeft < 0 ? { color: '#6b5e61' } : {}}>{m.daysLeft < 0 ? 'Expired' : m.daysLeft + ' days'}<br /><button className="btn btn-outline btn-sm" style={{ marginTop: 4, padding: '4px 10px' }} onClick={() => notify([m.id])}><i className="fa-regular fa-bell" /> Notify</button></div></div>
          ))}
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-h"><h2><i className="fa-solid fa-clock-rotate-left" />Latest Registrations</h2><div className="tools"><Link className="btn btn-outline btn-sm" to="/admin/members">All Registrations <i className="fa-solid fa-arrow-right" /></Link></div></div>
        <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Member</th><th>Registered</th><th>Diocese</th><th>Payment</th><th>Status</th><th /></tr></thead>
          <tbody>{(recent || []).slice(0, 6).map((m) => (
            <tr key={m.id}><td><div className="who"><img src={m.photos?.[0] || '/img/logo.png'} alt="" /><div><b>{m.name}</b><small>{m.id} • {m.gender}, {m.age}</small></div></div></td><td>{fmt(m.regDate)}</td><td>{m.diocese}</td>
              <td>{m.payment?.paid ? <span className="p-paid"><i className="fa-solid fa-circle-check" /> ₹{m.payment.amount}</span> : <span className="p-unpaid"><i className="fa-solid fa-circle-xmark" /> Unpaid</span>}</td>
              <td><Pill status={m.status} /></td><td><Link className="ibtn" to={`/admin/verify/${m.id}`} title="Open"><i className="fa-regular fa-eye" /></Link></td></tr>))}</tbody></table></div>
      </section>
    </>
  );
}
