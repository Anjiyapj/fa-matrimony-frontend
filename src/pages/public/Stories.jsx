import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { useToast } from '../../context/ToastContext';
import { fmt } from '../../lib/utils';
import PageHero from '../../components/PageHero';
import { Loading } from '../../components/ui';

export default function Stories() {
  const toast = useToast();
  const { hash } = useLocation();
  const { data: stories, loading } = useAsync(() => api.getStories(), []);
  const { data: stats } = useAsync(() => api.getPublicStats(), []);
  const [open, setOpen] = useState({});
  const [f, setF] = useState({ name: '', date: '', email: '', phone: '', message: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  useEffect(() => {
    if (!stories || !hash) return;
    const id = hash.slice(1); setOpen((o) => ({ ...o, [id]: true }));
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }, [stories, hash]);
  const submit = async (e) => {
    e.preventDefault();
    await api.submitEnquiry({ type: 'story', name: f.name, email: f.email, phone: f.phone, subject: 'Success story' + (f.date ? ' – married ' + fmt(f.date) : ''), message: f.message });
    setF({ name: '', date: '', email: '', phone: '', message: '' });
    toast('Thank you! Our office will contact you before publishing your story. 🙏', 4000);
  };
  return (
    <main className="page">
      <PageHero crumbs={[['Home', '/'], ['Success Stories']]} title="Success Stories" sub="Real couples. Real stories. United in faith." verse="What God has joined together, let no one separate." verseRef="MARK 10:9" />
      <div className="container">
        <div className="card stat-strip">
          {[['fa-solid fa-heart', stats?.couples, 'Couples united'], ['fa-solid fa-user-group', stats?.members, 'Registered members'], ['fa-solid fa-church', stats?.dioceses, 'Dioceses'], ['fa-solid fa-shield-heart', '100%', 'Verified profiles']].map(([i, n, t]) => (
            <div key={t}><span className="ico"><i className={i} /></span><b>{n ?? '…'}</b><span>{t}</span></div>
          ))}
        </div>
        {loading ? <Loading /> : (
          <div className="story-grid">
            {stories.map((s) => (
              <article key={s.id} id={s.id} className={'card s-card' + (open[s.id] ? ' open' : '') + (hash === '#' + s.id ? ' flash' : '')}>
                <img src={s.img} alt={s.couple} />
                <div className="s-body"><h3>{s.couple}</h3>
                  <small className="muted"><i className="fa-solid fa-ring" /> Married {fmt(s.married)}{s.parish ? ' • ' + s.parish : ''}</small>
                  <blockquote>{s.text}</blockquote>
                  {s.story && <><p className="s-more">{s.story}</p><button className="btn btn-outline btn-sm" onClick={() => setOpen({ ...open, [s.id]: !open[s.id] })}>{open[s.id] ? 'Show less' : 'Read their story'}</button></>}
                </div>
              </article>
            ))}
          </div>
        )}
        <section className="card share-card" id="share">
          <div className="share-art"><img src="/img/story3.jpg" alt="" /><q>“Your story may be the sign of hope another family is praying for.”</q></div>
          <form className="share-form" onSubmit={submit}>
            <h2 className="serif wine">Share Your Story</h2>
            <p className="muted">Married through Family Apostolate Matrimony? Tell us your story – our office will contact you before publishing it.</p>
            <div className="grid g2" style={{ marginTop: 12 }}>
              <div className="field"><label>Couple's Names <span className="rq">*</span></label><input className="input" required value={f.name} onChange={set('name')} placeholder="e.g. Jinu & Aleena" /></div>
              <div className="field"><label>Wedding Date</label><input className="input" type="date" value={f.date} onChange={set('date')} /></div>
              <div className="field"><label>Email <span className="rq">*</span></label><input className="input" type="email" required value={f.email} onChange={set('email')} /></div>
              <div className="field"><label>Phone</label><input className="input" type="tel" value={f.phone} onChange={set('phone')} /></div>
            </div>
            <div className="field" style={{ marginTop: 14 }}><label>Your Story <span className="rq">*</span></label><textarea className="input" rows="4" required value={f.message} onChange={set('message')} placeholder="How did you meet? How did faith guide your journey?" /></div>
            <button className="btn btn-primary" style={{ marginTop: 14 }}><i className="fa-solid fa-paper-plane" /> Submit Story</button>
          </form>
        </section>
      </div>
    </main>
  );
}
