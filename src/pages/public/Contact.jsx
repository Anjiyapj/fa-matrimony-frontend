import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import PageHero from '../../components/PageHero';
import { ErrorBox, Notice } from '../../components/ui';

const SUBJECTS = ['Registration help', 'Verification status', 'Payment', 'Renewal', 'Account hold', 'Marriage / delete account', 'Pre-marriage course', 'Report a concern', 'Other'];

export default function Contact() {
  const { user, isMember } = useAuth();
  const [sp] = useSearchParams();
  const blank = () => ({ name: isMember ? user.name : '', email: isMember ? user.email : '', phone: isMember ? user.mobile : '', subject: sp.get('subject') || SUBJECTS[0], message: '' });
  const [f, setF] = useState(blank);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await api.submitEnquiry({ type: 'contact', ...f }); setDone(f.name.split(' ')[0]); setF(blank()); }
    catch (e2) { setErr(e2); } finally { setBusy(false); }
  };
  return (
    <main className="page">
      <PageHero crumbs={[['Home', '/'], ['Contact']]} title="Contact Us" sub="We are here to help you and your family." verse="Ask and it will be given to you; seek and you will find." verseRef="MATTHEW 7:7" />
      <div className="container">
        <div className="contact-cards">
          <a className="card c-card" href="tel:+914872421234"><span className="ico"><i className="fa-solid fa-phone" /></span><b>Call Us</b><span>+91 487 242 1234</span></a>
          <a className="card c-card" href="mailto:familyapostolatetsr@gmail.com"><span className="ico"><i className="fa-regular fa-envelope" /></span><b>Email</b><span>familyapostolatetsr@gmail.com</span></a>
          <div className="card c-card"><span className="ico"><i className="fa-regular fa-clock" /></span><b>Office Hours</b><span>Mon – Sat : 9:00 AM – 5:00 PM</span></div>
          <Link className="card c-card" to="/location"><span className="ico"><i className="fa-solid fa-location-dot" /></span><b>Visit Us</b><span>P.B. No. 36, Thrissur, Kerala – 680001</span></Link>
        </div>
        <div className="contact-layout">
          <form className="card contact-form" onSubmit={submit}>
            <h2 className="serif wine">Send Us a Message</h2>
            <p className="muted">Questions about registration, verification, payment, renewal or account hold? Write to us and our office will reply.</p>
            {done && <Notice type="ok" icon="fa-solid fa-circle-check" style={{ marginTop: 12 }}>Thank you, {done}. Your message has been sent to the Family Apostolate office. We usually reply within 2 working days.</Notice>}
            {err && <ErrorBox error={err} />}
            <div className="grid g2" style={{ marginTop: 14 }}>
              <div className="field"><label>Your Name <span className="rq">*</span></label><input className="input" required value={f.name} onChange={set('name')} /></div>
              <div className="field"><label>Email <span className="rq">*</span></label><input className="input" type="email" required value={f.email} onChange={set('email')} /></div>
              <div className="field"><label>Phone</label><input className="input" type="tel" value={f.phone} onChange={set('phone')} /></div>
              <div className="field"><label>Subject</label><select className="select" value={f.subject} onChange={set('subject')}>{[...new Set([f.subject, ...SUBJECTS])].map((s) => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div className="field" style={{ marginTop: 14 }}><label>Message <span className="rq">*</span></label><textarea className="input" rows="5" required value={f.message} onChange={set('message')} /></div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} disabled={busy}><i className="fa-solid fa-paper-plane" /> {busy ? 'Sending…' : 'Send Message'}</button>
          </form>
          <aside className="side-stack">
            <div className="card guide-card"><h3><span className="ico"><i className="fa-solid fa-hands-praying" /></span>We pray for every family that writes to us</h3><p>Your message is read by the Family Apostolate office team. For urgent matters, please call during office hours.</p></div>
            <div className="card"><h3 className="card-title"><i className="fa-solid fa-share-nodes" />Follow Us</h3><div className="social-row"><a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook" /></a><a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a><a href="#" aria-label="YouTube"><i className="fa-brands fa-youtube" /></a><a href="#" aria-label="WhatsApp"><i className="fa-brands fa-whatsapp" /></a></div></div>
            <div className="card"><h3 className="card-title"><i className="fa-regular fa-circle-question" />Quick Answers</h3><div className="action-list">
              <Link to="/about"><i className="fa-solid fa-route" />How registration works<i className="fa-solid fa-chevron-right" /></Link>
              <Link to="/location"><i className="fa-solid fa-folder-open" />Documents for office registration<i className="fa-solid fa-chevron-right" /></Link>
              <Link to="/magazine/AR6"><i className="fa-solid fa-shield-heart" />Safety guidelines<i className="fa-solid fa-chevron-right" /></Link>
            </div></div>
          </aside>
        </div>
      </div>
    </main>
  );
}
