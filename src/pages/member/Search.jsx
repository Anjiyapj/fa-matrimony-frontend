import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { firstName } from '../../lib/utils';
import PageHero from '../../components/PageHero';
import { Empty, ErrorBox, Loading } from '../../components/ui';

const AGES = [['18-80', 'Any Age'], ['21-25', '21 – 25 years'], ['24-30', '24 – 30 years'], ['27-32', '27 – 32 years'], ['30-36', '30 – 36 years']];
const HEIGHTS = [['0-300', 'Any Height'], ['145-160', '145 – 160 cm'], ['155-170', '155 – 170 cm'], ['160-175', '160 – 175 cm'], ['170-190', '170 – 190 cm']];

export default function Search() {
  const { user, refreshSummary } = useAuth();
  const toast = useToast();
  const [sp] = useSearchParams();
  const { data: look } = useAsync(() => api.getLookups(), []);
  const initAge = sp.get('ageMin') || sp.get('ageMax') ? `${sp.get('ageMin') || 18}-${sp.get('ageMax') || 80}` : '18-80';
  const [form, setForm] = useState({ age: initAge, height: '0-300', eduGroup: sp.get('eduGroup') || '', jobGroup: sp.get('jobGroup') || '', diocese: sp.get('diocese') || '' });
  const [applied, setApplied] = useState(form);
  const [sort, setSort] = useState('new');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const query = () => {
    const [ageMin, ageMax] = applied.age.split('-').map(Number), [heightMin, heightMax] = applied.height.split('-').map(Number);
    return api.discover({ ageMin, ageMax, heightMin, heightMax, eduGroup: applied.eduGroup, jobGroup: applied.jobGroup, diocese: applied.diocese, sort });
  };
  const { data: rows, loading, error, reload } = useAsync(query, [applied, sort]);
  const ageOpts = AGES.some(([v]) => v === form.age) ? AGES : [...AGES, [form.age, form.age.replace('-', ' – ') + ' years']];
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const like = async (m) => {
    try {
      const r = await api.decide(m.id, 'like');
      toast(r.mutual ? <>It’s a match with {firstName(m)}! <Link to={`/chat/${m.id}`} style={{ color: '#fff', textDecoration: 'underline', marginLeft: 6 }}>Send a message</Link></> : `You liked ${firstName(m)} ♥ – ${m.gender === 'Female' ? 'her' : 'his'} reply will unlock chat`, 4500);
      reload(); refreshSummary();
    } catch (e) { toast(e.message); }
  };
  const Sel = ({ k, label, icon, options, any }) => (
    <div className="ref-row"><i className={icon} /><div><label>{label}</label>
      <select className="select" value={form[k]} onChange={set(k)}>{any && <option value="">{any}</option>}{options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>))}</select></div></div>
  );

  return (
    <main className="page">
      <PageHero crumbs={[['Home', '/'], ['Search']]} title="Search Profiles" sub="Find a partner who shares your faith and values." verse="Many waters cannot quench love; rivers cannot sweep it away." verseRef="SONG OF SONGS 8:7" />
      <div className="container search-layout">
        <form className="card refine" onSubmit={(e) => { e.preventDefault(); setApplied(form); }}>
          <h3 className="card-title"><i className="fa-solid fa-magnifying-glass" />Search Filters</h3>
          <p className="sub">Showing <b>{user.gender === 'Male' ? 'brides' : 'grooms'}</b> only – as per Church guidelines</p>
          {Sel({ k: 'age', label: 'Age', icon: 'fa-solid fa-user-group', options: ageOpts })}
          {Sel({ k: 'eduGroup', label: 'Qualification', icon: 'fa-solid fa-graduation-cap', options: look?.eduGroups || [], any: 'Any Qualification' })}
          {Sel({ k: 'jobGroup', label: 'Job', icon: 'fa-solid fa-briefcase', options: look?.jobGroups || [], any: 'Any Profession' })}
          {Sel({ k: 'height', label: 'Height', icon: 'fa-solid fa-ruler', options: HEIGHTS })}
          {Sel({ k: 'diocese', label: 'Diocese', icon: 'fa-solid fa-church', options: look?.dioceses || [], any: 'Any Diocese' })}
          <button className="btn btn-primary btn-block" style={{ marginTop: 14, height: 46 }}><i className="fa-solid fa-magnifying-glass" /> Search</button>
          <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => { const b = { age: '18-80', height: '0-300', eduGroup: '', jobGroup: '', diocese: '' }; setForm(b); setApplied(b); }}>Clear Filters</button>
          <div className="note-card"><i className="fa-solid fa-people-arrows" /><span>Only verified, active members appear in search. Members on hold are hidden.</span></div>
        </form>
        <section>
          <div className="results-head"><h3>{loading ? '…' : rows?.length ?? 0} Matching Profiles</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="muted" style={{ fontSize: 13 }}>Sort by</span>
              <select className="select" style={{ width: 180, height: 38 }} value={sort} onChange={(e) => setSort(e.target.value)}><option value="new">Newest first</option><option value="age">Age: low to high</option><option value="active">Recently active</option><option value="likedMe">Liked me first</option></select>
              <Link className="btn btn-primary btn-sm" to="/match"><i className="fa-solid fa-layer-group" /> Swipe Mode</Link></div></div>
          {error ? <ErrorBox error={error} /> : loading && !rows ? <Loading /> : !rows?.length ? <Empty title="No matching profiles">Try widening the age or height range, or choose “Any”.</Empty> : (
            <div className="results">
              {rows.map((m) => {
                const r = m.relation;
                return (
                  <article key={m.id} className="card r-card">
                    <div className="img"><img src={m.photos?.[0] || '/img/logo.png'} alt={m.name} /><span className="badge badge-online">{r.mutual ? 'Matched' : r.likesMe ? 'Likes you' : 'Verified'}</span></div>
                    <div className="body"><h4>{m.name} <i className="fa-solid fa-shield-heart verified-ico" /></h4>
                      <ul><li><i className="fa-solid fa-cake-candles" />{m.age} yrs &nbsp;•&nbsp; {m.height} cm</li><li><i className="fa-solid fa-graduation-cap" />{m.eduGroup} &nbsp;•&nbsp; {m.jobGroup}</li><li><i className="fa-solid fa-church" />{m.diocese}</li><li><i className="fa-solid fa-location-dot" />{m.location}</li></ul>
                      <div className="acts"><Link className="btn btn-outline btn-sm" to={`/profile/${m.id}`}>View Profile</Link>
                        {r.mutual ? <Link className="btn btn-primary btn-sm" to={`/chat/${m.id}`} title="Message"><i className="fa-regular fa-comments" /></Link>
                          : ['like', 'fav'].includes(r.myDecision) ? <button className="btn btn-ghost btn-sm" disabled>Liked</button>
                            : <button className="btn btn-primary btn-sm" title="Like" onClick={() => like(m)}><i className="fa-solid fa-heart" /></button>}</div></div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
