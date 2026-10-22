import { useMemo, useState } from 'react';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../context/AuthContext';
import { fmt, iso, monthLabel } from '../../lib/utils';
import { Loading, Pill } from '../../components/ui';
import { Legend, TrendBars } from './parts';

const MONTH_OPTIONS = [
  { value: 'all', label: 'All Months' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

export default function Reports() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState('all');

  const { data: trend } = useAsync(() => api.trend(undefined, year === 'all' ? undefined : year).catch(() => []), [year]);

  const years = useMemo(() => {
    const set = new Set([String(currentYear), String(currentYear - 1), '2025', '2024']);
    (trend || []).forEach((t) => {
      if (t.month) set.add(t.month.slice(0, 4));
    });
    const sorted = Array.from(set).sort((a, b) => b.localeCompare(a));
    return [
      { value: 'all', label: 'All Years' },
      ...sorted.map((y) => ({ value: y, label: y === String(currentYear) ? `${y} (Current)` : y }))
    ];
  }, [currentYear, trend]);

  const { data: s, loading } = useAsync(() => api.monthlyReport(month, year), [month, year]);

  const displayTrend = useMemo(() => {
    if (!trend || !trend.length) return [];
    if (year !== 'all') {
      return trend.filter((t) => t.month && t.month.startsWith(year));
    }
    return trend;
  }, [trend, year]);

  const totals = useMemo(() => {
    return (displayTrend || []).reduce((acc, t) => ({
      newReg: acc.newReg + (t.newReg || 0),
      active: Math.max(acc.active, t.active || 0),
      onHold: Math.max(acc.onHold, t.onHold || 0),
      inactive: Math.max(acc.inactive, t.inactive || 0),
      married: acc.married + (t.married || 0),
      revenue: acc.revenue + (t.revenue || 0)
    }), { newReg: 0, active: 0, onHold: 0, inactive: 0, married: 0, revenue: 0 });
  }, [displayTrend]);

  const label = useMemo(() => {
    const monthObj = MONTH_OPTIONS.find((m) => m.value === month);
    const monthName = monthObj ? monthObj.label : month;

    if (year === 'all' && month === 'all') return 'All Years • All Months (Cumulative Summary)';
    if (year !== 'all' && month === 'all') return `Year ${year} (All 12 Months Summary)`;
    if (year === 'all' && month !== 'all') return `${monthName} (Across All Years)`;
    return `${monthName} ${year}`;
  }, [year, month]);

  const csv = () => {
    const list = s?.rows || [];
    const rows = [['#', 'Profile ID', 'Name', 'Gender', 'Diocese', 'Registered', 'Expiry', 'Payment', 'Status'], ...list.map((r, i) => [i + 1, r.id, r.name, r.gender, r.diocese, fmt(r.regDate), fmt(r.expiryDate), r.paid ? '₹' + r.amount : '—', r.status])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const filename = `FA-Matrimony-Report-${year === 'all' ? 'AllYears' : year}-${month === 'all' ? 'AllMonths' : month}.csv`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  const tot = s ? (s.active || 0) + (s.inactive || 0) + (s.married || 0) + (s.pending || 0) + (s.onHold || 0) || 1 : 1;
  const seg = s ? [['#a8123c', s.active || 0], ['#8fb0e6', s.onHold || 0], ['#cfc4c6', s.inactive || 0], ['#e2405f', s.married || 0], ['#f2c66d', s.pending || 0]] : [];
  let acc = 0; const grad = seg.map(([c, n]) => { const a = acc; acc += (n / tot) * 100; return `${c} ${a}% ${acc}%`; }).join(', ');

  return (
    <>
      <div className="rep-head no-print" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#4b5563', whiteSpace: 'nowrap' }}>Report Period</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12.5, fontWeight: 500 }}><i className="fa-regular fa-calendar" /> Year</label>
            <select
              className="select"
              style={{ width: 140, height: 38, borderColor: '#a8123c', borderRadius: 8, fontWeight: 500 }}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {years.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12.5, fontWeight: 500 }}><i className="fa-regular fa-calendar-days" /> Month</label>
            <select
              className="select"
              style={{ width: 155, height: 38, borderColor: '#a8123c', borderRadius: 8, fontWeight: 500 }}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {MONTH_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-sm" onClick={csv} disabled={!s}><i className="fa-solid fa-file-csv" /> Export Excel / CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}><i className="fa-solid fa-file-pdf" /> Download PDF</button>
        </div>
      </div>
      {loading || !s ? <Loading /> : (
        <div className="rep-sheet">
          <div className="letter"><img src="/img/logo.png" alt="" />
            <div><h2>Family Apostolate – Thrissur Archdiocese</h2><p>Catholic Matrimony Service • Membership Report</p></div>
            <div className="meta"><b>{label}</b><br /><span className="muted">Generated {fmt(new Date())} by {user?.name}</span></div></div>
          <div className="rep-kpis r6">
            <div><b>{s.newReg}</b><span>{month === 'all' ? 'Total registrations' : 'New registrations'}</span></div><div><b>{s.active}</b><span>Active members</span></div>
            <div><b>{s.onHold}</b><span>On hold</span></div><div><b>{s.inactive}</b><span>Inactive (expired / rejected)</span></div>
            <div><b>{s.married}</b><span>Married</span></div><div><b>₹ {(s.revenue || 0).toLocaleString('en-IN')}</b><span>Subscription collected</span></div>
          </div>
          <div className="rep-split">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="donut" style={{ background: `conic-gradient(${grad})` }}><span><div><b>{s.rows?.length || 0}</b>members</div></span></div>
              <div className="legend" style={{ flexWrap: 'wrap', justifyContent: 'center' }}><span><i style={{ background: '#a8123c' }} />Active</span><span><i style={{ background: '#8fb0e6' }} />On hold</span><span><i style={{ background: '#cfc4c6' }} />Inactive</span><span><i style={{ background: '#e2405f' }} />Married</span><span><i style={{ background: '#f2c66d' }} />Pending</span></div>
            </div>
            <div>
              <div className="panel-h" style={{ marginBottom: 4 }}>
                <h2 style={{ fontSize: 17 }}>Membership trend ({year === 'all' ? 'Overall' : `Year ${year}`})</h2>
                <div className="tools"><Legend /></div>
              </div>
              <TrendBars data={displayTrend} height={160} />
            </div>
          </div>

          {/* Month Wise Breakdown Table for Current / Selected Year */}
          <div style={{ marginTop: 22, marginBottom: 18 }}>
            <div className="panel-h" style={{ marginBottom: 8 }}>
              <h2 style={{ fontSize: 16 }}>
                <i className="fa-solid fa-calendar-days wine" /> {year === 'all' ? 'All-Time Month-by-Month Performance' : `Year ${year} Month-by-Month Performance Breakdown`}
              </h2>
              <span className="muted" style={{ fontSize: 12.5 }}>
                Registrations, active members and revenue month-wise for {year === 'all' ? 'all recorded months' : `Current Year ${year}`}
              </span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th style={{ textAlign: 'center' }}>New Reg.</th>
                    <th style={{ textAlign: 'center' }}>Active</th>
                    <th style={{ textAlign: 'center' }}>On Hold</th>
                    <th style={{ textAlign: 'center' }}>Inactive</th>
                    <th style={{ textAlign: 'center' }}>Married</th>
                    <th style={{ textAlign: 'right' }}>Revenue Collected</th>
                    <th className="no-print" style={{ textAlign: 'center' }}>Filter</th>
                  </tr>
                </thead>
                <tbody>
                  {!displayTrend.length ? (
                    <tr><td colSpan={8} className="muted" style={{ textAlign: 'center', padding: '24px' }}>No monthly performance data available for Year {year}.</td></tr>
                  ) : (
                    displayTrend.map((t) => {
                      const [tYear, tMonth] = (t.month || '').split('-');
                      const isSelected = (year === 'all' || year === tYear) && month === tMonth;
                      return (
                        <tr key={t.month} style={isSelected ? { background: '#fdf2f4', fontWeight: 600 } : {}}>
                          <td><b>{monthLabel(t.month + '-01')}</b></td>
                          <td style={{ textAlign: 'center' }}>{t.newReg || 0}</td>
                          <td style={{ textAlign: 'center' }}><span className="p-active">{t.active || 0}</span></td>
                          <td style={{ textAlign: 'center' }}>{t.onHold || 0}</td>
                          <td style={{ textAlign: 'center' }}>{t.inactive || 0}</td>
                          <td style={{ textAlign: 'center' }}>{t.married || 0}</td>
                          <td style={{ textAlign: 'right' }}>₹ {(t.revenue || 0).toLocaleString('en-IN')}</td>
                          <td className="no-print" style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                              style={{ padding: '2px 9px', fontSize: 11.5 }}
                              onClick={() => {
                                if (isSelected) {
                                  setMonth('all');
                                } else {
                                  setYear(tYear);
                                  setMonth(tMonth);
                                }
                              }}
                            >
                              {isSelected ? 'Selected' : 'View'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {displayTrend.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#fdf2f4', fontWeight: 700, borderTop: '2px solid #ecd6d6' }}>
                      <td><b>Total ({year === 'all' ? 'All Months' : `Year ${year}`})</b></td>
                      <td style={{ textAlign: 'center' }}><b>{totals.newReg}</b></td>
                      <td style={{ textAlign: 'center' }}><span className="p-active"><b>{s?.active ?? totals.active}</b></span></td>
                      <td style={{ textAlign: 'center' }}><b>{s?.onHold ?? totals.onHold}</b></td>
                      <td style={{ textAlign: 'center' }}><b>{s?.inactive ?? totals.inactive}</b></td>
                      <td style={{ textAlign: 'center' }}><b>{totals.married}</b></td>
                      <td style={{ textAlign: 'right', color: 'var(--wine)' }}><b>₹ {totals.revenue.toLocaleString('en-IN')}</b></td>
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        <span className="muted" style={{ fontSize: 11, fontWeight: 600 }}>Summary</span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div className="panel-h">
            <h2 style={{ fontSize: 17 }}>{month === 'all' ? 'All Registered Members (All Time)' : `Member list – ${label}`}</h2>
            <div className="tools muted" style={{ fontSize: 12.5 }}>Approved: <b>{s.approved}</b> &nbsp;•&nbsp; Subscriptions ending: <b>{s.expiredIn}</b> &nbsp;•&nbsp; Pending: <b>{s.pending}</b> &nbsp;•&nbsp; Showing <b>{s.rows?.length || 0}</b> profiles</div>
          </div>
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>#</th><th>Profile ID</th><th>Name</th><th>Gender</th><th>Diocese</th><th>Registered</th><th>Expiry</th><th>Paid</th><th>Status</th></tr></thead>
            <tbody>
              {!s.rows?.length ? (
                <tr><td colSpan={9} className="muted" style={{ textAlign: 'center', padding: '24px' }}>No members registered as of {label}.</td></tr>
              ) : (
                s.rows.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.gender}</td>
                    <td>{r.diocese}</td>
                    <td>{fmt(r.regDate)}</td>
                    <td>{fmt(r.expiryDate)}</td>
                    <td>{r.paid ? '₹' + r.amount : '—'}</td>
                    <td><Pill status={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody></table></div>
          <div className="sign"><div>Prepared by (Office)</div><div>Director, Family Apostolate</div></div>
        </div>
      )}
    </>
  );
}
