import { useMemo, useState } from 'react';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../context/AuthContext';
import { fmt, iso, monthLabel } from '../../lib/utils';
import { Loading, Pill } from '../../components/ui';
import { Legend, TrendBars } from './parts';

export default function Reports() {
  const { user } = useAuth();
  const months = useMemo(() => { const t = new Date(), a = []; for (let i = 7; i >= 0; i--) a.push(iso(new Date(t.getFullYear(), t.getMonth() - i, 1)).slice(0, 7)); return a; }, []);
  const [month, setMonth] = useState(months[months.length - 1]);
  const { data: s, loading } = useAsync(() => api.monthlyReport(month), [month]);
  const { data: trend } = useAsync(() => api.trend(7), []);
  const label = monthLabel(month + '-01');
  const csv = () => {
    const rows = [['#', 'Profile ID', 'Name', 'Gender', 'Diocese', 'Registered', 'Expiry', 'Payment', 'Status'], ...s.rows.map((r, i) => [i + 1, r.id, r.name, r.gender, r.diocese, fmt(r.regDate), fmt(r.expiryDate), r.paid ? '₹' + r.amount : '—', r.status])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `FA-Matrimony-Report-${month}.csv`; a.click();
  };
  const tot = s ? s.active + s.inactive + s.married + s.pending + s.onHold || 1 : 1;
  const seg = s ? [['#a8123c', s.active], ['#8fb0e6', s.onHold], ['#cfc4c6', s.inactive], ['#e2405f', s.married], ['#f2c66d', s.pending]] : [];
  let acc = 0; const grad = seg.map(([c, n]) => { const a = acc; acc += (n / tot) * 100; return `${c} ${a}% ${acc}%`; }).join(', ');

  return (
    <>
      <div className="rep-head no-print">
        <label className="muted" style={{ fontSize: 13 }}>Report month</label>
        <select className="select" style={{ width: 220 }} value={month} onChange={(e) => setMonth(e.target.value)}>{months.map((m) => <option key={m} value={m}>{monthLabel(m + '-01')}</option>)}</select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-sm" onClick={csv} disabled={!s}><i className="fa-solid fa-file-csv" /> Export Excel / CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}><i className="fa-solid fa-file-pdf" /> Download PDF</button>
        </div>
      </div>
      {loading || !s ? <Loading /> : (
        <div className="rep-sheet">
          <div className="letter"><img src="/img/logo.png" alt="" />
            <div><h2>Family Apostolate – Thrissur Archdiocese</h2><p>Catholic Matrimony Service • Monthly Membership Report</p></div>
            <div className="meta"><b>{label}</b><br /><span className="muted">Generated {fmt(new Date())} by {user?.name}</span></div></div>
          <div className="rep-kpis r6">
            <div><b>{s.newReg}</b><span>New registrations</span></div><div><b>{s.active}</b><span>Active members</span></div>
            <div><b>{s.onHold}</b><span>On hold</span></div><div><b>{s.inactive}</b><span>Inactive (expired / rejected)</span></div>
            <div><b>{s.married}</b><span>Married</span></div><div><b>₹ {s.revenue.toLocaleString('en-IN')}</b><span>Subscription collected</span></div>
          </div>
          <div className="rep-split">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="donut" style={{ background: `conic-gradient(${grad})` }}><span><div><b>{s.rows.length}</b>members</div></span></div>
              <div className="legend" style={{ flexWrap: 'wrap', justifyContent: 'center' }}><span><i style={{ background: '#a8123c' }} />Active</span><span><i style={{ background: '#8fb0e6' }} />On hold</span><span><i style={{ background: '#cfc4c6' }} />Inactive</span><span><i style={{ background: '#e2405f' }} />Married</span><span><i style={{ background: '#f2c66d' }} />Pending</span></div>
            </div>
            <div>
              <div className="panel-h" style={{ marginBottom: 4 }}><h2 style={{ fontSize: 17 }}>Membership trend</h2><div className="tools"><Legend /></div></div>
              <TrendBars data={trend} height={160} />
            </div>
          </div>
          <div className="panel-h"><h2 style={{ fontSize: 17 }}>Member list – {label}</h2>
            <div className="tools muted" style={{ fontSize: 12.5 }}>Approved this month: <b>{s.approved}</b> &nbsp;•&nbsp; Subscriptions ending: <b>{s.expiredIn}</b> &nbsp;•&nbsp; Pending: <b>{s.pending}</b></div></div>
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>#</th><th>Profile ID</th><th>Name</th><th>Gender</th><th>Diocese</th><th>Registered</th><th>Expiry</th><th>Paid</th><th>Status</th></tr></thead>
            <tbody>{s.rows.map((r, i) => <tr key={r.id}><td>{i + 1}</td><td>{r.id}</td><td>{r.name}</td><td>{r.gender}</td><td>{r.diocese}</td><td>{fmt(r.regDate)}</td><td>{fmt(r.expiryDate)}</td><td>{r.paid ? '₹' + r.amount : '—'}</td><td><Pill status={r.status} /></td></tr>)}</tbody></table></div>
          <div className="sign"><div>Prepared by (Office)</div><div>Director, Family Apostolate</div></div>
        </div>
      )}
    </>
  );
}
