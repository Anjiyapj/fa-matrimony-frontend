import { useState } from 'react';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { useToast } from '../../context/ToastContext';
import { adminChanged } from '../../components/AdminLayout';
import { fmt, fmtTime } from '../../lib/utils';
import { Loading } from '../../components/ui';
import { Seg } from './parts';

export default function Enquiries() {
  const toast = useToast();
  const [status, setStatus] = useState('open');
  const { data: rows, loading, reload } = useAsync(() => api.listEnquiries(status), [status]);
  const toggle = async (x) => { await api.updateEnquiry(x.id, { status: x.status === 'open' ? 'closed' : 'open' }); toast(x.status === 'open' ? 'Marked as resolved' : 'Reopened'); reload(); adminChanged(); };
  return (
    <section className="panel">
      <div className="panel-h"><h2><i className="fa-regular fa-envelope" />Enquiries &amp; Story Submissions</h2>
        <div className="tools"><Seg value={status} onChange={setStatus} options={[['open', 'Open'], ['closed', 'Closed'], ['all', 'All']]} /></div></div>
      {loading && !rows ? <Loading /> : !rows.length ? <p className="muted" style={{ padding: '16px 0' }}>No enquiries here.</p> : rows.map((x) => (
        <div key={x.id} className="enq">
          <span className="ico" style={{ width: 40, height: 40, fontSize: 16 }}><i className={x.type === 'story' ? 'fa-solid fa-heart' : 'fa-regular fa-envelope'} /></span>
          <div><b>{x.name}</b> <span className={'pill ' + (x.type === 'story' ? 's-married' : 's-pending')} style={{ marginLeft: 6 }}>{x.type === 'story' ? 'Success story' : x.subject || 'Enquiry'}</span>
            <p>{x.message}</p><small className="muted">{x.email}{x.phone ? ' • ' + x.phone : ''} • {fmt(x.at)} {fmtTime(x.at)}{x.memberId ? ' • member ' + x.memberId : ''}</small></div>
          <div className="row-acts">
            {x.email && <a className="ibtn" title="Reply by email" href={`mailto:${x.email}?subject=${encodeURIComponent('Re: ' + (x.subject || 'Your enquiry'))}`}><i className="fa-solid fa-reply" /></a>}
            <button className={'ibtn' + (x.status === 'open' ? ' ok' : '')} title={x.status === 'open' ? 'Mark resolved' : 'Reopen'} onClick={() => toggle(x)}><i className={'fa-solid ' + (x.status === 'open' ? 'fa-check' : 'fa-rotate-left')} /></button>
          </div>
        </div>
      ))}
    </section>
  );
}
