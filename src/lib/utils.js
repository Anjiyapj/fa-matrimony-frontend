// Small shared helpers (dates, formatting, labels)

export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DAY = 864e5;

export const toDate = (s) => (s ? (s instanceof Date ? s : new Date(String(s).length <= 10 ? s + 'T00:00:00' : s)) : null);
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const iso = (d) => { d = toDate(d); const z = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
export const addMonths = (d, m) => { const x = new Date(toDate(d)); x.setMonth(x.getMonth() + m); return x; };
export const addDays = (d, n) => new Date(toDate(d).getTime() + n * DAY);
export const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY);
export const ts = (s) => (s ? new Date(s).getTime() : 0);

export const fmt = (s) => { const d = toDate(s); return d ? `${String(d.getDate()).padStart(2, '0')} ${MON[d.getMonth()]} ${d.getFullYear()}` : '—'; };
export const fmtTime = (s) => { const d = toDate(s); return d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''; };
export const fmtShort = (s) => {
  const d = toDate(s); if (!d) return '';
  const diff = (today() - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / DAY;
  return diff <= 0 ? fmtTime(s) : diff < 2 ? 'Yesterday' : `${d.getDate()} ${MON[d.getMonth()]}`;
};
export const monthLabel = (d) => toDate(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

export const age = (dob) => {
  const b = toDate(dob), t = new Date(); if (!b) return '';
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
};
export const ft = (cm) => { const inch = Math.round(cm / 2.54); return `${Math.floor(inch / 12)}'${inch % 12}"`; };
export const firstName = (m) => (m?.name || '').split(' ')[0];
export const uniq = (a) => [...new Set(a)].filter(Boolean).sort();
export const uniquePhotos = (m) => [...new Set(m?.photos || [])];

/* Effective member status – the backend returns this as `status` (see API.md). */
export const STATUS_LABEL = {
  pending: 'Pending', active: 'Active', expiring: 'Expiring', expired: 'Expired',
  on_hold: 'On Hold', married: 'Married', rejected: 'Rejected'
};

export const fileToDataUrl = (file, max = 480) => new Promise((res) => {
  if (!file || !file.type?.startsWith('image/')) return res(null);
  const img = new Image();
  img.onload = () => {
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.82));
  };
  img.onerror = () => res(null);
  img.src = URL.createObjectURL(file);
});

export const completion = (m) => {
  const f = [m.name, m.dob, m.diocese, m.parish, m.height, m.weight, m.bloodGroup, m.education, m.job, m.employer, m.income, m.location, m.languages,
    m.family?.father, m.family?.mother, m.family?.brothers, m.family?.sisters, (m.interests || []).length, m.about, m.quote, uniquePhotos(m).length >= 3];
  return Math.round((f.filter(Boolean).length / f.length) * 100);
};
