/* ============================================================
   HTTP API CLIENT – talks to the real backend (see API.md).
   Same function names / return shapes as the mock API.
   Base URL comes from VITE_API_BASE_URL. Auth = Bearer token.
   ============================================================ */
const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
let token = null;

export class ApiError extends Error { constructor(message, status = 400, data) { super(message); this.status = status; this.data = data; } }

async function request(method, path, body, { query, form } = {}) {
  const url = new URL(BASE + path, window.location.origin);
  if (query) Object.entries(query).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && url.searchParams.set(k, v));
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;                                   // multipart – browser sets the boundary
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  let res;
  try { res = await fetch(url, { method, headers, body: payload }); }
  catch (e) { throw new ApiError('Cannot reach the server. Please check your internet connection.', 0); }
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  return data;
}
const get = (p, query) => request('GET', p, undefined, { query });
const post = (p, b) => request('POST', p, b ?? {});
const patch = (p, b) => request('PATCH', p, b);
const del = (p) => request('DELETE', p);

/* fields → JSON part "data"; files → photos[] / idProof parts */
function multipart(fields, files = {}) {
  const fd = new FormData();
  fd.append('data', JSON.stringify(fields));
  (files.photos || []).forEach((f) => f && fd.append('photos', f));
  if (files.idProof) fd.append('idProof', files.idProof);
  if (files.parishLetter) fd.append('parishLetter', files.parishLetter);
  return fd;
}

export const httpApi = {
  setToken(t) { token = t; },

  // auth
  login: (b) => post('/auth/login', b),
  me: () => get('/auth/me'),
  logout: () => post('/auth/logout'),

  // public
  getLookups: () => get('/lookups'),
  getPublicStats: () => get('/stats/public'),
  getArticles: () => get('/articles'),
  getArticle: (id) => get(`/articles/${id}`),
  getStories: () => get('/stories'),
  submitEnquiry: (b) => post('/enquiries', b),
  register: (fields, files) => request('POST', '/members/register', undefined, { form: multipart(fields, files) }),

  // member – own account
  getMyProfile: () => get('/me/profile'),
  getSummary: () => get('/me/summary'),
  markNotificationsRead: () => post('/me/notifications/read'),
  requestHold: (b) => post('/me/hold', b),
  cancelHoldRequest: () => del('/me/hold'),
  resumeFromHold: () => post('/me/hold/resume'),
  reportMarried: (b) => post('/me/married', b),

  // member – discovery
  discover: (filters) => get('/me/discover', filters),
  getProfile: (id) => get(`/profiles/${id}`),
  decide: (id, type) => post(`/profiles/${id}/decision`, { type }),
  reportProfile: (id, reason) => post(`/profiles/${id}/report`, { reason }),
  getMatches: () => get('/me/matches'),
  getLikedMe: () => get('/me/liked-me'),
  getThread: (id) => get(`/me/messages/${id}`),
  sendMessage: (id, text) => post(`/me/messages/${id}`, { text }),

  // admin
  adminSummary: () => get('/admin/summary'),
  listMembers: (q) => get('/admin/members', q),
  getMember: (id) => get(`/admin/members/${id}`),
  createMember: (fields, files) => request('POST', '/admin/members', undefined, { form: multipart(fields, files) }),
  updateMember: (id, b) => patch(`/admin/members/${id}`, b),
  setPayment: (id, paid) => post(`/admin/members/${id}/payment`, { paid }),
  setIdVerified: (id, verified) => post(`/admin/members/${id}/id-verified`, { verified }),
  approveMember: (id) => post(`/admin/members/${id}/approve`),
  rejectMember: (id, remarks) => post(`/admin/members/${id}/reject`, { remarks }),
  renewMember: (id) => post(`/admin/members/${id}/renew`),
  markMarried: (id, info) => post(`/admin/members/${id}/married`, info || {}),
  deleteMember: (id) => del(`/admin/members/${id}`),
  notifyRenewal: (ids) => post('/admin/notifications/renewal', { ids }),
  replacePhoto: (id, index, file) => { const fd = new FormData(); fd.append('index', index); fd.append('photo', file); return request('POST', `/admin/members/${id}/photos`, undefined, { form: fd }); },
  listHolds: (status) => get('/admin/holds', { status }),
  decideHold: (id, b) => post(`/admin/members/${id}/hold/decision`, b),
  placeHold: (id, b) => post(`/admin/members/${id}/hold`, b),
  releaseHold: (id) => del(`/admin/members/${id}/hold`),
  listMarried: () => get('/admin/married'),
  monthlyReport: (month) => get('/admin/reports/monthly', { month }),
  trend: (months) => get('/admin/reports/trend', { months }),
  listEnquiries: (status) => get('/admin/enquiries', { status }),
  updateEnquiry: (id, b) => patch(`/admin/enquiries/${id}`, b),
  resetDemo: () => Promise.reject(new ApiError('Reset is only available in mock mode.'))
};
