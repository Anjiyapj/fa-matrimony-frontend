import { useEffect, useState } from 'react';
import { STATUS_LABEL, uniquePhotos } from '../lib/utils';

export const Loading = ({ full, text = 'Loading…' }) => (
  <div className={'loading' + (full ? ' full' : '')}><i className="fa-solid fa-heart fa-beat" /> {text}</div>
);
export const ErrorBox = ({ error, children }) => (
  <div className="notice err"><i className="fa-solid fa-circle-exclamation" /><span>{error?.message || String(error)}{children}</span></div>
);
export const Empty = ({ icon = 'fa-regular fa-face-smile', title, children, style }) => (
  <div className="card empty-state" style={style}><i className={icon} /><h3>{title}</h3>{children}</div>
);
export const Pill = ({ status }) => <span className={`pill s-${status === 'on_hold' ? 'hold' : status}`}>{STATUS_LABEL[status] || status}</span>;
export const Kv = ({ icon, k, children }) => (
  <div className="kv"><i className={icon} /><span className="k">{k}</span><span>{children}</span></div>
);
export const Notice = ({ type = '', icon = 'fa-solid fa-circle-info', children, style }) => (
  <div className={'notice ' + type} style={style}><i className={icon} /><span>{children}</span></div>
);

export function Modal({ open, onClose, children, width = 560 }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal show" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-form" style={{ width: `min(${width}px, 94%)` }} role="dialog" aria-modal="true">{children}</div>
    </div>
  );
}

export function Gallery({ member, badge = 'Verified' }) {
  const photos = uniquePhotos(member);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [member?.id]);
  const go = (n) => setI((n + photos.length) % photos.length);
  return (
    <div>
      <div className="photo-main">
        <img src={photos[i]} alt={member.name} />
        {badge && <span className="badge badge-online">{badge}</span>}
        {photos.length > 1 && <>
          <button className="photo-nav prev" aria-label="Previous photo" onClick={() => go(i - 1)}><i className="fa-solid fa-chevron-left" /></button>
          <button className="photo-nav next" aria-label="Next photo" onClick={() => go(i + 1)}><i className="fa-solid fa-chevron-right" /></button>
        </>}
      </div>
      {photos.length > 1 && (
        <div className="thumbs">
          {photos.slice(0, 4).map((p, k) => <img key={k} src={p} alt="" className={k === i ? 'on' : ''} onClick={() => setI(k)} />)}
        </div>
      )}
    </div>
  );
}

export function Ring({ p }) {
  return <div className="ring" style={{ '--p': p }}><span>{p}%</span></div>;
}

export function VerifyList({ idType = 'ID proof' }) {
  return (
    <ul className="check-list" style={{ marginTop: 6 }}>
      <li><i className="fa-solid fa-check" />Email Verified</li>
      <li><i className="fa-solid fa-check" />Mobile Number Verified</li>
      <li><i className="fa-solid fa-check" /><span>Identity Proof Verified<br /><small className="muted">{idType}</small></span><span className="verified-tag">Verified</span></li>
      <li><i className="fa-solid fa-check" />Photos Verified</li>
    </ul>
  );
}
