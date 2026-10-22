import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { useToast } from '../../context/ToastContext';
import { adminChanged } from '../../components/AdminLayout';
import { fmt, fmtTime } from '../../lib/utils';
import { Empty, Loading, Pill } from '../../components/ui';
import { Seg } from './parts';

export default function Moderation() {
  const toast = useToast();
  const [tab, setTab] = useState('reports'); // 'reports' | 'blocks'
  const [reportStatus, setReportStatus] = useState('all');
  const [q, setQ] = useState('');

  const { data: reports, loading: loadingReports, reload: reloadReports } = useAsync(
    () => api.listUserReports(reportStatus),
    [reportStatus]
  );

  const { data: blocks, loading: loadingBlocks, reload: reloadBlocks } = useAsync(
    () => api.listBlocks(),
    []
  );

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      await api.updateReportStatus(reportId, newStatus);
      toast(`Report status updated to ${newStatus}`, 3500);
      reloadReports();
      adminChanged();
    } catch (err) {
      toast(err.message, 4000);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Dismiss and remove this report?')) return;
    try {
      await api.deleteReport(reportId);
      toast('Report dismissed successfully', 3500);
      reloadReports();
      adminChanged();
    } catch (err) {
      toast(err.message, 4000);
    }
  };

  const handleUnblock = async (blockId, blockerName, blockedName) => {
    if (!window.confirm(`Lift block between ${blockerName} and ${blockedName}? They will be able to see each other again.`)) return;
    try {
      await api.adminUnblock(blockId);
      toast('Block removed successfully', 3500);
      reloadBlocks();
      adminChanged();
    } catch (err) {
      toast(err.message, 4000);
    }
  };

  // Filter reports by search query
  const filteredReports = (reports || []).filter((r) => {
    if (!q.trim()) return true;
    const term = q.toLowerCase();
    return (
      (r.reportedMember?.name || '').toLowerCase().includes(term) ||
      (r.reportedMember?.id || '').toLowerCase().includes(term) ||
      (r.reporter?.name || '').toLowerCase().includes(term) ||
      (r.reporter?.id || '').toLowerCase().includes(term) ||
      (r.reason || '').toLowerCase().includes(term) ||
      (r.messageText || '').toLowerCase().includes(term)
    );
  });

  // Filter blocks by search query
  const filteredBlocks = (blocks || []).filter((b) => {
    if (!q.trim()) return true;
    const term = q.toLowerCase();
    return (
      (b.blockerMember?.name || '').toLowerCase().includes(term) ||
      (b.blockerMember?.id || '').toLowerCase().includes(term) ||
      (b.blockedMember?.name || '').toLowerCase().includes(term) ||
      (b.blockedMember?.id || '').toLowerCase().includes(term) ||
      (b.reason || '').toLowerCase().includes(term)
    );
  });

  const flaggedCount = (reports || []).filter((r) => r.status === 'flagged' || r.status === 'pending').length;

  return (
    <section className="panel">
      <div className="panel-h" style={{ flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2><i className="fa-solid fa-shield-halved" />Safety &amp; Moderation</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`btn btn-sm ${tab === 'reports' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setTab('reports'); setQ(''); }}
            >
              <i className="fa-solid fa-flag" /> User Reports {flaggedCount > 0 && <span className="cnt" style={{ background: '#c92a2a', color: '#fff', padding: '1px 6px', borderRadius: 10, fontSize: 11, marginLeft: 4 }}>{flaggedCount}</span>}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${tab === 'blocks' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setTab('blocks'); setQ(''); }}
            >
              <i className="fa-solid fa-ban" /> Block List ({blocks?.length || 0})
            </button>
          </div>
        </div>

        {tab === 'reports' && (
          <Seg
            value={reportStatus}
            onChange={(v) => setReportStatus(v)}
            options={[
              ['all', 'All Reports'],
              ['flagged', 'Flagged / New'],
              ['reviewed', 'Reviewed'],
              ['resolved', 'Resolved']
            ]}
          />
        )}

        <div style={{ position: 'relative', minWidth: 240, marginLeft: 'auto' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 12, top: 11, color: 'var(--muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 34, width: '100%' }}
            placeholder={tab === 'reports' ? 'Search reports, names, reasons…' : 'Search blocked or blocker…'}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {tab === 'reports' ? (
        <div>
          {loadingReports && !reports ? (
            <Loading />
          ) : !filteredReports.length ? (
            <div style={{ padding: '36px 0', textAlign: 'center' }}>
              <Empty icon="fa-solid fa-shield-heart" title="No reports found">
                {q ? 'No reports matched your search term.' : 'There are currently no reported users or flagged messages.'}
              </Empty>
            </div>
          ) : (
            filteredReports.map((r) => {
              const reported = r.reportedMember;
              const reporter = r.reporter;
              const isFlagged = r.status === 'flagged' || r.status === 'pending';

              return (
                <div
                  key={r.id || r._id}
                  className="q-card"
                  style={{
                    backgroundColor: isFlagged ? 'rgba(255, 235, 235, 0.35)' : 'transparent',
                    borderLeft: isFlagged ? '4px solid #c92a2a' : '4px solid transparent',
                    paddingLeft: 14,
                    marginBottom: 12
                  }}
                >
                  <img
                    src={reported?.photo || '/img/logo.png'}
                    alt=""
                    style={{ border: isFlagged ? '2px solid #e03131' : '1px solid #ddd' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0 }}>
                        <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>Reported Member: </span>
                        <Link to={`/admin/verify/${reported?.id || r.member}`} style={{ color: 'var(--wine)', fontWeight: 600 }}>
                          {reported?.name || `Member ${r.member}`}
                        </Link>
                        {reported?.status && <Pill status={reported.status} style={{ marginLeft: 8 }} />}
                      </h4>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: r.targetType === 'message' ? '#ffe8cc' : '#e7f5ff',
                          color: r.targetType === 'message' ? '#d9480f' : '#1971c2',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}
                      >
                        <i className={r.targetType === 'message' ? 'fa-regular fa-comment-dots' : 'fa-solid fa-user'} style={{ marginRight: 4 }} />
                        {r.targetType === 'message' ? 'Flagged Message' : 'Profile Report'}
                      </span>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: r.status === 'resolved' ? '#ebfbee' : r.status === 'reviewed' ? '#e7f5ff' : '#ffe3e3',
                          color: r.status === 'resolved' ? '#2b8a3e' : r.status === 'reviewed' ? '#1c7ed6' : '#c92a2a',
                          textTransform: 'capitalize'
                        }}
                      >
                        ● {r.status}
                      </span>
                    </div>

                    <div className="meta" style={{ marginTop: 4 }}>
                      <span>Reported ID: <b>{reported?.id || r.member}</b></span>
                      {reported?.diocese && <span> • Diocese: {reported.diocese}</span>}
                      {reported?.mobile && <span> • 📞 {reported.mobile}</span>}
                      {reported?.email && <span> • ✉ {reported.email}</span>}
                    </div>

                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                      Reported by: <Link to={`/admin/verify/${reporter?.id || r.by}`} className="wine"><b>{reporter?.name || `Member ${r.by}`}</b> ({r.by})</Link>
                      &nbsp;•&nbsp; Date: <b>{fmt(r.at)} {fmtTime(r.at)}</b>
                    </div>

                    {/* Highlighted Reason Box */}
                    <div className="reason" style={{ marginTop: 8 }}>
                      <b style={{ color: 'var(--wine)' }}>Reason for Report:</b> {r.reason}
                    </div>

                    {/* Flagged Message Snippet if applicable */}
                    {r.targetType === 'message' && r.messageText && (
                      <div
                        style={{
                          background: '#fff',
                          border: '1.5px dashed #ffa8a8',
                          borderRadius: 10,
                          padding: '8px 14px',
                          fontSize: 13,
                          marginTop: 6,
                          color: '#495057'
                        }}
                      >
                        <i className="fa-solid fa-quote-left" style={{ color: '#e03131', marginRight: 6 }} />
                        <i>"{r.messageText}"</i>
                      </div>
                    )}
                  </div>

                  <div className="acts">
                    <select
                      className="select select-sm"
                      value={r.status}
                      onChange={(e) => handleUpdateStatus(r.id || r._id, e.target.value)}
                    >
                      <option value="flagged">Status: Flagged</option>
                      <option value="reviewed">Status: Reviewed</option>
                      <option value="resolved">Status: Resolved</option>
                    </select>

                    <Link className="btn btn-outline btn-sm" to={`/admin/verify/${reported?.id || r.member}`}>
                      <i className="fa-regular fa-eye" /> Verify Member
                    </Link>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#c92a2a' }}
                      onClick={() => handleDeleteReport(r.id || r._id)}
                    >
                      <i className="fa-regular fa-trash-can" /> Dismiss Report
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div>
          {loadingBlocks && !blocks ? (
            <Loading />
          ) : !filteredBlocks.length ? (
            <div style={{ padding: '36px 0', textAlign: 'center' }}>
              <Empty icon="fa-solid fa-ban" title="No blocked users">
                {q ? 'No block records matched your search term.' : 'No members have blocked each other on the platform yet.'}
              </Empty>
            </div>
          ) : (
            filteredBlocks.map((b) => {
              const blocker = b.blockerMember;
              const blocked = b.blockedMember;

              return (
                <div key={b.id || b._id} className="q-card" style={{ paddingLeft: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src={blocker?.photo || '/img/logo.png'} alt="" style={{ border: '2px solid var(--wine)' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--wine)', marginTop: 4 }}>BLOCKER</span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h4>
                        <Link to={`/admin/verify/${blocker?.id || b.blocker}`} style={{ color: 'var(--wine)' }}>
                          {blocker?.name || `Member ${b.blocker}`}
                        </Link>
                        <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}> blocked </span>
                        <Link to={`/admin/verify/${blocked?.id || b.blocked}`} style={{ color: '#c92a2a', fontWeight: 600 }}>
                          {blocked?.name || `Member ${b.blocked}`}
                        </Link>
                      </h4>
                    </div>

                    <div className="meta" style={{ marginTop: 4 }}>
                      <span>Blocker ID: <b>{blocker?.id || b.blocker}</b> ({blocker?.gender || '—'}, {blocker?.diocese || '—'})</span>
                      &nbsp;•&nbsp;
                      <span>Blocked ID: <b>{blocked?.id || b.blocked}</b> ({blocked?.gender || '—'}, {blocked?.diocese || '—'})</span>
                    </div>

                    <div className="kv-mini" style={{ marginTop: 6 }}>
                      <span>Blocked On: <b>{fmt(b.createdAt)} {fmtTime(b.createdAt)}</b></span>
                      {b.reason && <span>Reason / Note: <b>{b.reason}</b></span>}
                      <span>Status: <b style={{ color: '#c92a2a' }}>Active Block (Hidden 2-way)</b></span>
                    </div>
                  </div>

                  <div className="acts">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ color: '#c92a2a', borderColor: '#ffa8a8' }}
                      onClick={() => handleUnblock(b.id || b._id, blocker?.name || b.blocker, blocked?.name || b.blocked)}
                    >
                      <i className="fa-solid fa-unlock" /> Lift Block
                    </button>
                    <Link className="btn btn-ghost btn-sm" to={`/admin/verify/${blocked?.id || b.blocked}`}>
                      <i className="fa-regular fa-eye" /> View Blocked Member
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
