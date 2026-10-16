/* ============================================================
   MOCK API – behaves like the real backend described in API.md,
   but keeps data in the browser (localStorage) starting from seed.json.
   Every function returns a Promise, exactly like the HTTP client
   (src/api/http.js), so pages never know which one they are using.
   ============================================================ */
import SEED from './seed.json';
import { today, iso, addMonths, addDays, daysBetween, toDate, age, ts, uniq, fmt } from '../../lib/utils';

const KEY = 'fa_mock_db_v4';
const clone = (o) => JSON.parse(JSON.stringify(o));
let db = load();
let token = null;

function load() {
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { /* ignore */ }
  return clone(SEED);
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { throw new ApiError('Browser storage is full – use Admin → Reset demo data.', 507); }
}

export class ApiError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const delay = (v, ms = 120) => new Promise((res) => setTimeout(() => res(clone(v)), ms));
const fail = (msg, status = 400) => Promise.reject(new ApiError(msg, status));
const now = () => new Date().toISOString();
const findM = (id) => db.members.find((m) => m.id === id);

/* ---------- status rules (mirrors the backend) ---------- */
function normalizeHolds() {
  let changed = false;
  db.members.forEach((m) => {
    if (m.hold?.status === 'active' && toDate(m.hold.until) <= today()) { m.hold.status = 'ended'; changed = true; }
  });
  if (changed) save();
}
export function effectiveStatus(m) {
  if (m.status !== 'active') return m.status;                 // pending | married | rejected
  if (m.hold?.status === 'active' && toDate(m.hold.from) <= today() && today() < toDate(m.hold.until)) return 'on_hold';
  const left = daysBetween(today(), m.expiryDate);
  return left < 0 ? 'expired' : left <= (db.settings.reminderDays || 30) ? 'expiring' : 'active';
}
const isLive = (m) => ['active', 'expiring'].includes(effectiveStatus(m));
const daysLeft = (m) => (m.expiryDate ? daysBetween(today(), m.expiryDate) : null);

/* ---------- likes / matches ---------- */
const decision = (a, b) => { const l = db.likes.filter((x) => x.from === a && x.to === b); return l.length ? l[l.length - 1].type : null; };
const likes = (a, b) => ['like', 'fav'].includes(decision(a, b));
const mutual = (a, b) => likes(a, b) && likes(b, a);
const blocked = (a, b) => decision(a, b) === 'block' || decision(b, a) === 'block';
const unread = (me, other) => { const r = ts((db.reads[me] || {})[other]); return db.messages.filter((x) => x.from === other && x.to === me && ts(x.at) > r).length; };
const thread = (a, b) => db.messages.filter((x) => (x.from === a && x.to === b) || (x.from === b && x.to === a)).sort((x, y) => ts(x.at) - ts(y.at));

/* ---------- DTOs ---------- */
function adminDTO(m) { const { password, ...rest } = m; return { ...rest, password, status: effectiveStatus(m), accountStatus: m.status, daysLeft: daysLeft(m), age: age(m.dob) }; }
function selfDTO(m) { const { password, ...rest } = m; return { ...rest, status: effectiveStatus(m), daysLeft: daysLeft(m), age: age(m.dob) }; }
function publicDTO(m, viewerId) {
  const isMutual = viewerId ? mutual(viewerId, m.id) : false;
  const { password, payment, idProof, hold, marriage, remarks, email, mobile, ...rest } = m;
  return {
    ...rest, age: age(m.dob), status: effectiveStatus(m),
    idVerified: !!idProof?.verified,
    contact: isMutual ? { email, mobile } : null,
    relation: viewerId ? { myDecision: decision(viewerId, m.id), likesMe: likes(m.id, viewerId), mutual: isMutual } : null
  };
}

/* ---------- auth helpers ---------- */
function session() {
  if (!token) return null;
  const [, role, id] = token.split('.');
  if (role === 'admin') { const a = db.admins.find((x) => x.id === id); return a ? { role, admin: a } : null; }
  const m = findM(id); return m ? { role: 'member', member: m } : null;
}
function needMember() {
  const s = session(); if (!s || s.role !== 'member') throw new ApiError('Please log in.', 401);
  const st = effectiveStatus(s.member);
  if (!['active', 'expiring', 'on_hold'].includes(st)) throw new ApiError('Your account is not active.', 403);
  return s.member;
}
function needLiveMember() {
  const me = needMember();
  if (effectiveStatus(me) === 'on_hold') throw new ApiError(`Your account is on hold until ${fmt(me.hold.until)}. Resume it from My Profile to continue.`, 423);
  return me;
}
function needAdmin() { const s = session(); if (!s || s.role !== 'admin') throw new ApiError('Admin login required.', 401); return s.admin; }
const guard = (fn) => (...args) => { try { normalizeHolds(); return fn(...args); } catch (e) { return Promise.reject(e); } };
const notify = (to, type, text) => db.notifications.push({ id: 'N' + Date.now() + Math.random().toString(36).slice(2, 5), to, type, text, at: now(), read: false });

/* ---------- monthly statistics ---------- */
function monthStats(start) {
  start = toDate(start); const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59);
  const cut = end > new Date() ? new Date() : end;
  const inM = (d) => d && toDate(d) >= start && toDate(d) <= end;
  const s = { newReg: 0, approved: 0, active: 0, inactive: 0, married: 0, pending: 0, onHold: 0, rejected: 0, expiredIn: 0, revenue: 0, rows: [] };
  db.members.forEach((r) => {
    const reg = toDate(r.regDate), appr = toDate(r.approvedDate), exp = toDate(r.expiryDate);
    if (reg > cut) return;
    if (inM(reg)) { s.newReg++; if (r.payment?.paid) s.revenue += r.payment.amount || 500; }
    if (inM(appr)) s.approved++;
    if (inM(exp)) s.expiredIn++;
    let st;
    if (r.status === 'rejected') st = 'rejected';
    else if (!appr || appr > cut) st = 'pending';
    else if (r.status === 'married' && toDate(r.marriage?.reportedAt || addMonths(appr, 2)) <= cut) st = 'married';
    else if (r.hold && ['active', 'ended'].includes(r.hold.status) && toDate(r.hold.from) <= cut && cut < toDate(r.hold.until)) st = 'on_hold';
    else if (exp < cut) st = 'expired';
    else st = 'active';
    ({ active: () => s.active++, expired: () => s.inactive++, rejected: () => { s.inactive++; s.rejected++; }, married: () => s.married++, pending: () => s.pending++, on_hold: () => s.onHold++ })[st]();
    s.rows.push({ id: r.id, name: r.name, gender: r.gender, diocese: r.diocese, regDate: r.regDate, expiryDate: r.expiryDate, paid: !!r.payment?.paid, amount: r.payment?.amount || 500, status: st });
  });
  s.rows.sort((a, b) => b.regDate.localeCompare(a.regDate));
  return s;
}

/* ============================================================ */
export const mockApi = {
  setToken(t) { token = t; },

  /* ---------- auth ---------- */
  login: guard(({ username, password, role }) => {
    const u = (username || '').trim().toLowerCase();
    if (role === 'admin') {
      const a = db.admins.find((x) => x.username.toLowerCase() === u && x.password === password);
      if (!a) return fail('Invalid admin username or password.', 401);
      token = `mock.admin.${a.id}`;
      return delay({ token, role: 'admin', user: { id: a.id, name: a.name, role: a.role } });
    }
    const digits = u.replace(/\D/g, '');
    const m = db.members.find((x) => (x.email.toLowerCase() === u || (digits.length >= 10 && x.mobile.replace(/\D/g, '').endsWith(digits))) && x.password === password);
    if (!m) return fail('Email / mobile or password is incorrect.', 401);
    const st = effectiveStatus(m), first = m.name.split(' ')[0];
    if (st === 'pending') return fail(`Hi ${first}, your profile (${m.id}) is awaiting verification by the Family Apostolate office. You can log in once it is approved.`, 403);
    if (st === 'rejected') return fail(`Your registration was not approved${m.remarks ? ': ' + m.remarks : ''}. Please contact the Family Apostolate office.`, 403);
    if (st === 'married') return fail('This profile has been marked as married and will be removed by the office. God bless your family!', 403);
    if (st === 'expired') return fail(`Your 6-month subscription ended on ${fmt(m.expiryDate)}. Please renew at the Family Apostolate office.`, 403);
    token = `mock.member.${m.id}`; m.lastActive = now(); save();
    return delay({ token, role: 'member', user: selfDTO(m) });
  }),
  me: guard(() => {
    const s = session(); if (!s) return fail('Not logged in', 401);
    if (s.role === 'admin') return delay({ role: 'admin', user: { id: s.admin.id, name: s.admin.name, role: s.admin.role } });
    const st = effectiveStatus(s.member);
    if (!['active', 'expiring', 'on_hold'].includes(st)) { token = null; return fail('Session ended', 401); }
    return delay({ role: 'member', user: selfDTO(s.member) });
  }),
  logout() { token = null; return delay({ ok: true }, 20); },

  /* ---------- public content ---------- */
  getLookups: guard(() => delay({
    dioceses: uniq(db.members.map((m) => m.diocese)),
    eduGroups: uniq(db.members.map((m) => m.eduGroup)),
    jobGroups: uniq(db.members.map((m) => m.jobGroup)),
    settings: db.settings
  })),
  getPublicStats: guard(() => delay({
    members: db.members.length, active: db.members.filter(isLive).length,
    couples: db.stories.length + db.members.filter((m) => m.status === 'married').length,
    dioceses: new Set(db.members.map((m) => m.diocese)).size
  })),
  getArticles: guard(() => delay([...db.articles].sort((a, b) => b.date.localeCompare(a.date)))),
  getArticle: guard((id) => { const a = db.articles.find((x) => x.id === id); return a ? delay(a) : fail('Article not found', 404); }),
  getStories: guard(() => delay(db.stories)),
  submitEnquiry: guard((data) => {
    const s = session();
    db.enquiries.push({ id: 'ENQ' + Date.now().toString().slice(-7), type: data.type || 'contact', memberId: s?.member?.id || null, name: data.name, email: data.email, phone: data.phone || '', subject: data.subject || '', message: data.message, at: now(), status: 'open' });
    save(); return delay({ ok: true });
  }),

  /* ---------- registration ---------- */
  register: guard(async (data) => {
    const email = (data.email || '').trim().toLowerCase();
    if (db.members.some((m) => m.email.toLowerCase() === email)) throw new ApiError('This email is already registered. Please log in instead.', 409);
    const id = 'FATA26' + (Math.max(1000, ...db.members.map((m) => +m.id.slice(-4))) + 1);
    const photos = (data.photos || []).filter(Boolean);
    while (photos.length < 3) photos.push(photos[0] || '/img/logo.png');
    const paid = data.paymentMode && data.paymentMode !== 'Office';
    const t = iso(new Date());
    const { photos: _p, paymentMode, idProofName, ...fields } = data;
    db.members.push({
      ...fields, id, email, photos,
      idProof: { type: 'Aadhaar / ID', file: idProofName || 'not uploaded', verified: false },
      regDate: t, approvedDate: null, expiryDate: null, status: 'pending', remarks: '', hold: null, marriage: null,
      payment: { amount: db.settings.planFee || 500, paid, mode: paid ? paymentMode : null, txn: paid ? 'TXN' + Date.now().toString().slice(-8) : null, date: paid ? t : null },
      views: 0, lastActive: now()
    });
    save(); return delay({ id, email, status: 'pending' });
  }),

  /* ---------- member: own account ---------- */
  getMyProfile: guard(() => {
    const me = needMember();
    return delay({
      ...selfDTO(me),
      stats: { matches: db.members.filter((m) => m.gender !== me.gender && mutual(me.id, m.id)).length, likedMe: db.likes.filter((l) => l.to === me.id && ['like', 'fav'].includes(l.type) && !decision(me.id, l.from)).length },
      notifications: db.notifications.filter((n) => n.to === me.id).sort((a, b) => ts(b.at) - ts(a.at)).slice(0, 6)
    });
  }),
  getSummary: guard(() => {
    const me = needMember();
    const matches = db.members.filter((m) => m.gender !== me.gender && mutual(me.id, m.id) && !blocked(me.id, m.id));
    return delay({
      unread: matches.reduce((s, m) => s + unread(me.id, m.id), 0),
      likedMe: db.likes.filter((l) => l.to === me.id && ['like', 'fav'].includes(l.type) && !decision(me.id, l.from)).length,
      notices: db.notifications.filter((n) => n.to === me.id && !n.read).length,
      matches: matches.length
    }, 30);
  }),
  markNotificationsRead: guard(() => { const me = needMember(); db.notifications.forEach((n) => { if (n.to === me.id) n.read = true; }); save(); return delay({ ok: true }, 20); }),

  /* Hold: member asks the office to pause the account for N months */
  requestHold: guard(({ months, reason }) => {
    const me = needMember(), st = effectiveStatus(me);
    if (!['active', 'expiring'].includes(st)) throw new ApiError('Only an active account can be put on hold.');
    if (me.hold?.status === 'requested') throw new ApiError('You already have a hold request waiting for approval.');
    const max = db.settings.maxHoldMonths || 6;
    if (!(months >= 1 && months <= max)) throw new ApiError(`Hold period must be between 1 and ${max} months.`);
    me.hold = { status: 'requested', months: +months, reason: reason || '', requestedAt: now(), from: null, until: null };
    save(); return delay(selfDTO(me));
  }),
  cancelHoldRequest: guard(() => {
    const me = needMember(); if (me.hold?.status !== 'requested') throw new ApiError('No pending hold request.');
    me.hold = { ...me.hold, status: 'cancelled', decidedAt: now() }; save(); return delay(selfDTO(me));
  }),
  resumeFromHold: guard(() => {
    const me = needMember(); if (effectiveStatus(me) !== 'on_hold') throw new ApiError('Your account is not on hold.');
    const unused = Math.max(0, daysBetween(today(), me.hold.until));
    me.expiryDate = iso(addDays(me.expiryDate, -unused));
    me.hold = { ...me.hold, status: 'ended', until: iso(today()), resumedAt: now() };
    save(); return delay(selfDTO(me));
  }),
  /* Married: member reports marriage → profile hidden at once, office deletes the account */
  reportMarried: guard(({ date, spouseName, viaPlatform, partnerId, shareStory, note }) => {
    const me = needMember();
    if (!date || !spouseName) throw new ApiError('Please enter the wedding date and spouse name.');
    me.status = 'married';
    me.marriage = { date, spouseName, viaPlatform: !!viaPlatform, partnerId: partnerId || null, shareStory: !!shareStory, note: note || '', reportedAt: now(), reportedBy: 'member' };
    if (shareStory) db.enquiries.push({ id: 'ENQ' + Date.now().toString().slice(-7), type: 'story', memberId: me.id, name: `${me.name} & ${spouseName}`, email: me.email, phone: me.mobile, subject: 'Success story – married ' + date, message: note || 'Happy to share our story.', at: now(), status: 'open' });
    token = null; save(); return delay({ ok: true });
  }),

  /* ---------- member: discovery & profiles ---------- */
  discover: guard((f = {}) => {
    const me = needLiveMember();
    let L = db.members.filter((m) => m.id !== me.id && m.gender !== me.gender && isLive(m) && !blocked(me.id, m.id));
    if (f.undecidedOnly) L = L.filter((m) => !decision(me.id, m.id));
    L = L.filter((m) => {
      const a = age(m.dob);
      return a >= (f.ageMin || 18) && a <= (f.ageMax || 80) && m.height >= (f.heightMin || 0) && m.height <= (f.heightMax || 300)
        && (!f.eduGroup || m.eduGroup === f.eduGroup) && (!f.jobGroup || m.jobGroup === f.jobGroup) && (!f.diocese || m.diocese === f.diocese);
    });
    if (f.sort === 'age') L.sort((a, b) => age(a.dob) - age(b.dob));
    else if (f.sort === 'active') L.sort((a, b) => ts(b.lastActive) - ts(a.lastActive));
    else if (f.sort === 'likedMe') L.sort((a, b) => likes(b.id, me.id) - likes(a.id, me.id));
    else L.sort((a, b) => (b.approvedDate || '').localeCompare(a.approvedDate || ''));
    return delay(L.map((m) => publicDTO(m, me.id)));
  }),
  getProfile: guard((id) => {
    const me = needLiveMember(), m = findM(id);
    if (!m || m.gender === me.gender || !isLive(m) || blocked(me.id, m.id)) throw new ApiError('This profile is not available.', 404);
    m.views = (m.views || 0) + 1; save();
    return delay(publicDTO(m, me.id));
  }),
  decide: guard((id, type) => {
    const me = needLiveMember(); if (!findM(id)) throw new ApiError('Profile not found', 404);
    db.likes = db.likes.filter((x) => !(x.from === me.id && x.to === id));
    db.likes.push({ from: me.id, to: id, type, at: now() });
    save(); return delay({ type, mutual: ['like', 'fav'].includes(type) && mutual(me.id, id) });
  }),
  reportProfile: guard((id, reason) => { const me = needMember(); db.reports.push({ by: me.id, member: id, reason, at: now() }); save(); return delay({ ok: true }); }),

  /* ---------- member: matches & chat ---------- */
  getMatches: guard(() => {
    const me = needLiveMember();
    const L = db.members.filter((m) => m.id !== me.id && m.gender !== me.gender && mutual(me.id, m.id) && !blocked(me.id, m.id) && isLive(m))
      .map((m) => { const t = thread(me.id, m.id); return { member: publicDTO(m, me.id), lastMessage: t[t.length - 1] || null, unread: unread(me.id, m.id) }; })
      .sort((a, b) => ts(b.lastMessage?.at) - ts(a.lastMessage?.at));
    return delay(L);
  }),
  getLikedMe: guard(() => {
    const me = needLiveMember();
    const ids = db.likes.filter((l) => l.to === me.id && ['like', 'fav'].includes(l.type) && !decision(me.id, l.from)).map((l) => l.from);
    return delay(db.members.filter((m) => ids.includes(m.id) && isLive(m)).map((m) => publicDTO(m, me.id)));
  }),
  getThread: guard((id) => {
    const me = needLiveMember(); if (!mutual(me.id, id)) throw new ApiError('Messaging opens after you both like each other.', 403);
    (db.reads[me.id] = db.reads[me.id] || {})[id] = now(); save();
    return delay(thread(me.id, id));
  }),
  sendMessage: guard((id, text) => {
    const me = needLiveMember(); if (!mutual(me.id, id)) throw new ApiError('Messaging opens after you both like each other.', 403);
    const msg = { id: 'MSG' + Date.now(), from: me.id, to: id, text: String(text).slice(0, 2000), at: now() };
    db.messages.push(msg); (db.reads[me.id] = db.reads[me.id] || {})[id] = now(); save(); return delay(msg, 40);
  }),

  /* ============== ADMIN ============== */
  adminSummary: guard(() => {
    needAdmin(); const c = {}; db.members.forEach((m) => { const s = effectiveStatus(m); c[s] = (c[s] || 0) + 1; });
    const ym = iso(new Date()).slice(0, 7);
    return delay({
      total: db.members.length, counts: c, newThisMonth: db.members.filter((m) => m.regDate.startsWith(ym)).length,
      holdRequests: db.members.filter((m) => m.hold?.status === 'requested').length,
      marriedToDelete: db.members.filter((m) => m.status === 'married').length,
      openEnquiries: db.enquiries.filter((e) => e.status === 'open').length,
      reports: db.reports.length
    }, 40);
  }),
  listMembers: guard(({ status = 'all', q = '', sort = 'new' } = {}) => {
    needAdmin(); q = q.toLowerCase();
    const L = db.members.filter((m) => (status === 'all' || effectiveStatus(m) === status) && (!q || (m.name + m.id + m.diocese + m.email).toLowerCase().includes(q)))
      .sort((a, b) => (sort === 'old' ? 1 : -1) * (a.regDate.localeCompare(b.regDate) || a.id.localeCompare(b.id)));
    return delay(L.map(adminDTO));
  }),
  getMember: guard((id) => { needAdmin(); const m = findM(id); return m ? delay(adminDTO(m)) : fail('Member not found', 404); }),
  createMember: guard((data) => {
    const a = needAdmin(); const email = (data.email || '').toLowerCase();
    if (db.members.some((m) => m.email.toLowerCase() === email)) throw new ApiError('That email is already registered.', 409);
    const id = 'FATA26' + (Math.max(1000, ...db.members.map((m) => +m.id.slice(-4))) + 1), t = iso(new Date());
    const photos = (data.photos || []).filter(Boolean); while (photos.length < 3) photos.push(photos[0] || '/img/logo.png');
    db.members.push({
      community: 'Syro-Malabar', maritalStatus: 'Never Married', motherTongue: 'Malayalam', languages: 'English, Malayalam', family: {}, interests: [], preferences: {},
      quote: 'Seeking a partner to walk together in faith and build a Christ-centered family.', about: '', jobGroup: 'Business', employer: '', income: '', weight: null, bloodGroup: '',
      ...data, id, email, photos, education: data.eduGroup, location: data.place || data.diocese,
      idProof: { type: 'Aadhaar / ID', file: data.idProofName || 'collected at office', verified: false },
      regDate: t, approvedDate: null, expiryDate: null, status: 'pending', remarks: 'Registered at office by ' + a.name, hold: null, marriage: null,
      payment: { amount: 500, paid: !!data.paid, mode: data.paid ? 'Office' : null, txn: data.paid ? 'OFF' + Date.now().toString().slice(-6) : null, date: data.paid ? t : null }, views: 0
    });
    save(); return delay({ id });
  }),
  updateMember: guard((id, patch) => {
    needAdmin(); const m = findM(id); if (!m) throw new ApiError('Member not found', 404);
    if (patch.email && db.members.some((x) => x !== m && x.email.toLowerCase() === patch.email.toLowerCase())) throw new ApiError('Another member already uses that email.', 409);
    Object.assign(m, patch); save(); return delay(adminDTO(m));
  }),
  setPayment: guard((id, paid) => {
    needAdmin(); const m = findM(id);
    m.payment = { ...(m.payment || { amount: 500 }), paid, mode: paid ? m.payment?.mode || 'Office' : m.payment?.mode, txn: paid ? m.payment?.txn || 'OFF' + Date.now().toString().slice(-6) : m.payment?.txn, date: paid ? m.payment?.date || iso(new Date()) : m.payment?.date };
    save(); return delay(adminDTO(m));
  }),
  setIdVerified: guard((id, verified) => { needAdmin(); const m = findM(id); m.idProof = { ...(m.idProof || {}), verified }; save(); return delay(adminDTO(m)); }),
  approveMember: guard((id) => {
    const a = needAdmin(); const m = findM(id);
    if (!m.payment?.paid) throw new ApiError('Mark the payment as received before approving.');
    const t = today(); m.status = 'active'; m.approvedDate = iso(t); m.expiryDate = iso(addMonths(t, db.settings.planMonths || 6)); m.remarks = '';
    m.idProof = { ...(m.idProof || {}), verified: true };
    notify(m.id, 'approved', `Your profile was approved by ${a.name}. Membership valid till ${fmt(m.expiryDate)}.`);
    save(); return delay(adminDTO(m));
  }),
  rejectMember: guard((id, remarks) => {
    needAdmin(); if (!remarks) throw new ApiError('Please enter the reason for rejection.');
    const m = findM(id); m.status = 'rejected'; m.remarks = remarks; m.approvedDate = null; m.expiryDate = null; save(); return delay(adminDTO(m));
  }),
  renewMember: guard((id) => {
    const a = needAdmin(); const m = findM(id); const t = today();
    m.payment = { amount: 500, paid: true, mode: 'Office', txn: 'REN' + Date.now().toString().slice(-6), date: iso(t) };
    m.status = 'active'; m.approvedDate = iso(t); m.expiryDate = iso(addMonths(t, 6)); if (m.hold?.status === 'active') m.hold.status = 'ended';
    notify(m.id, 'renewed', `Membership renewed by ${a.name} till ${fmt(m.expiryDate)}.`); save(); return delay(adminDTO(m));
  }),
  markMarried: guard((id, info = {}) => {
    const a = needAdmin(); const m = findM(id); m.status = 'married';
    m.marriage = m.marriage || { date: info.date || iso(new Date()), spouseName: info.spouseName || '', viaPlatform: false, partnerId: null, shareStory: false, note: 'Marked by office', reportedAt: now(), reportedBy: a.name };
    save(); return delay(adminDTO(m));
  }),
  deleteMember: guard((id) => {
    needAdmin(); db.members = db.members.filter((m) => m.id !== id);
    db.likes = db.likes.filter((l) => l.from !== id && l.to !== id);
    db.messages = db.messages.filter((x) => x.from !== id && x.to !== id);
    db.notifications = db.notifications.filter((n) => n.to !== id);
    save(); return delay({ ok: true });
  }),
  notifyRenewal: guard((ids) => {
    needAdmin(); ids.forEach((id) => { const m = findM(id); if (m) notify(id, 'renewal', `Your subscription ends on ${fmt(m.expiryDate)}. Please renew (₹ 500 for 6 months).`); });
    save(); return delay({ sent: ids.length });
  }),

  /* ---------- admin: holds ---------- */
  listHolds: guard((status = 'requested') => {
    needAdmin();
    const L = db.members.filter((m) => m.hold && (status === 'all' || (status === 'active' ? effectiveStatus(m) === 'on_hold' : m.hold.status === status)))
      .sort((a, b) => ts(b.hold.requestedAt || b.hold.decidedAt) - ts(a.hold.requestedAt || a.hold.decidedAt));
    return delay(L.map(adminDTO));
  }),
  decideHold: guard((id, { approve, note = '', months }) => {
    const a = needAdmin(); const m = findM(id);
    if (m.hold?.status !== 'requested') throw new ApiError('There is no pending hold request for this member.');
    if (approve) {
      const mo = +(months || m.hold.months), from = today(), until = addMonths(from, mo);
      m.hold = { ...m.hold, status: 'active', months: mo, from: iso(from), until: iso(until), decidedAt: now(), decidedBy: a.name, note: note || `Approved. Subscription extended by ${mo} month${mo > 1 ? 's' : ''}.` };
      m.expiryDate = iso(addMonths(m.expiryDate, mo));
      notify(m.id, 'hold', `Your account is on hold from ${fmt(iso(from))} to ${fmt(iso(until))}. Your profile is hidden during this time and your membership is extended to ${fmt(m.expiryDate)}.`);
    } else {
      if (!note) throw new ApiError('Please enter a note explaining why the hold was not approved.');
      m.hold = { ...m.hold, status: 'rejected', decidedAt: now(), decidedBy: a.name, note };
      notify(m.id, 'hold', `Your hold request was not approved: ${note}`);
    }
    save(); return delay(adminDTO(m));
  }),
  placeHold: guard((id, { months, reason }) => {
    const a = needAdmin(); const m = findM(id);
    if (!['active', 'expiring'].includes(effectiveStatus(m))) throw new ApiError('Only active members can be put on hold.');
    const mo = +months, from = today(), until = addMonths(from, mo);
    m.hold = { status: 'active', months: mo, reason: reason || 'Placed by office', requestedAt: now(), from: iso(from), until: iso(until), decidedAt: now(), decidedBy: a.name, note: 'Placed on hold by the office.' };
    m.expiryDate = iso(addMonths(m.expiryDate, mo));
    notify(m.id, 'hold', `The office placed your account on hold until ${fmt(iso(until))}. Membership extended to ${fmt(m.expiryDate)}.`);
    save(); return delay(adminDTO(m));
  }),
  releaseHold: guard((id) => {
    const a = needAdmin(); const m = findM(id); if (effectiveStatus(m) !== 'on_hold') throw new ApiError('This member is not on hold.');
    const unused = Math.max(0, daysBetween(today(), m.hold.until));
    m.expiryDate = iso(addDays(m.expiryDate, -unused));
    m.hold = { ...m.hold, status: 'ended', until: iso(today()), releasedBy: a.name };
    notify(m.id, 'hold', `Your account is active again. Membership valid till ${fmt(m.expiryDate)}.`);
    save(); return delay(adminDTO(m));
  }),

  /* ---------- admin: married (awaiting deletion) ---------- */
  listMarried: guard(() => { needAdmin(); return delay(db.members.filter((m) => m.status === 'married').sort((a, b) => ts(b.marriage?.reportedAt) - ts(a.marriage?.reportedAt)).map(adminDTO)); }),

  /* ---------- admin: reports ---------- */
  monthlyReport: guard((month) => { needAdmin(); return delay(monthStats(month + '-01')); }),
  trend: guard((n = 7) => {
    needAdmin(); const t = new Date(), out = [];
    for (let i = n - 1; i >= 0; i--) { const d = new Date(t.getFullYear(), t.getMonth() - i, 1); const s = monthStats(d); out.push({ month: iso(d).slice(0, 7), active: s.active, newReg: s.newReg, inactive: s.inactive, onHold: s.onHold }); }
    return delay(out);
  }),

  /* ---------- admin: enquiries ---------- */
  listEnquiries: guard((status = 'open') => { needAdmin(); return delay(db.enquiries.filter((e) => status === 'all' || e.status === status).sort((a, b) => ts(b.at) - ts(a.at))); }),
  updateEnquiry: guard((id, patch) => { needAdmin(); const e = db.enquiries.find((x) => x.id === id); Object.assign(e, patch); save(); return delay(e); }),

  /* ---------- demo only ---------- */
  resetDemo() { db = clone(SEED); save(); return delay({ ok: true }); }
};
