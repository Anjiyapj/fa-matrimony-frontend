import { Link } from 'react-router-dom';
import { Kv, Ring, VerifyList } from './ui';
import { completion, fmt, ft } from '../lib/utils';

export const BASE_TABS = [['basic', 'fa-solid fa-user', 'Basic Details'], ['edu', 'fa-solid fa-graduation-cap', 'Education & Career'], ['fam', 'fa-solid fa-people-roof', 'Family Details'], ['pref', 'fa-regular fa-heart', 'Preferences']];

export function ProfileHeader({ m, children }) {
  return (
    <>
      <h2 className="p-name">{m.name} <i className="fa-solid fa-shield-heart verified-ico" /></h2>
      <div className="p-meta"><span>{m.age} Years</span><span>Roman Catholic</span><span>{m.maritalStatus}</span></div>
      {children}
      <div className="quote-band" style={{ fontSize: 19 }}>“{m.quote}”</div>
    </>
  );
}

export function Tabs({ tabs, tab, setTab }) {
  return (
    <div className="tabs">
      {tabs.map(([id, ic, label]) => <button key={id} className={'tab' + (tab === id ? ' active' : '')} onClick={() => setTab(id)}><i className={ic} />{label}</button>)}
    </div>
  );
}

export function TabPanel({ m, tab }) {
  const f = m.family || {}, pr = m.preferences || {};
  if (tab === 'basic') return (<><h3 className="pane-title"><i className="fa-solid fa-user" />Basic Details</h3>
    <div className="kv-cols" style={{ marginTop: 4 }}><div>
      <Kv icon="fa-regular fa-calendar" k="Date of Birth">{fmt(m.dob)} ({m.age} Years)</Kv><Kv icon="fa-solid fa-church" k="Diocese">{m.diocese}</Kv>
      <Kv icon="fa-solid fa-house-chimney" k="Parish">{m.parish}</Kv><Kv icon="fa-solid fa-people-group" k="Community">{m.community}</Kv>
      <Kv icon="fa-regular fa-comment-dots" k="Mother Tongue">{m.motherTongue}</Kv><Kv icon="fa-solid fa-language" k="Languages">{m.languages}</Kv>
    </div><div>
      <Kv icon="fa-regular fa-heart" k="Marital Status">{m.maritalStatus}</Kv><Kv icon="fa-solid fa-person" k="Height">{m.height} cm ({ft(m.height)})</Kv>
      <Kv icon="fa-solid fa-weight-scale" k="Weight">{m.weight ? m.weight + ' kg' : '—'}</Kv><Kv icon="fa-solid fa-droplet" k="Blood Group">{m.bloodGroup || '—'}</Kv>
      <Kv icon="fa-solid fa-location-dot" k="Current Location">{m.location}</Kv><Kv icon="fa-solid fa-briefcase" k="Profession">{m.job}</Kv>
    </div></div></>);
  if (tab === 'edu') return (<><h3 className="pane-title"><i className="fa-solid fa-graduation-cap" />Education &amp; Career</h3>
    <div className="kv-cols"><div><Kv icon="fa-solid fa-graduation-cap" k="Qualification">{m.education}</Kv><Kv icon="fa-solid fa-layer-group" k="Category">{m.eduGroup}</Kv></div>
      <div><Kv icon="fa-solid fa-briefcase" k="Profession">{m.job}</Kv><Kv icon="fa-solid fa-building" k="Employer">{m.employer || '—'}</Kv><Kv icon="fa-solid fa-indian-rupee-sign" k="Annual Income">{m.income || '—'}</Kv></div></div></>);
  if (tab === 'fam') return (<><h3 className="pane-title"><i className="fa-solid fa-people-roof" />Family Details</h3>
    <div className="kv-cols"><div><Kv icon="fa-solid fa-user-tie" k="Father">{f.father || '—'}</Kv><Kv icon="fa-solid fa-user" k="Mother">{f.mother || '—'}</Kv><Kv icon="fa-solid fa-house" k="Family Type">{f.type || '—'}</Kv></div>
      <div><Kv icon="fa-solid fa-person" k="Brothers">{f.brothers || '—'}</Kv><Kv icon="fa-solid fa-person-dress" k="Sisters">{f.sisters || '—'}</Kv><Kv icon="fa-solid fa-location-dot" k="Native Place">{f.native || m.place}</Kv></div></div></>);
  if (tab === 'pref') return (<><h3 className="pane-title"><i className="fa-regular fa-heart" />Partner Preferences</h3>
    <div className="kv-cols"><div><Kv icon="fa-solid fa-cake-candles" k="Age">{pr.ageMin ? `${pr.ageMin} – ${pr.ageMax} Years` : 'Any'}</Kv><Kv icon="fa-solid fa-ruler-vertical" k="Height">{pr.heightMin ? `${pr.heightMin} – ${pr.heightMax} cm` : 'Any'}</Kv><Kv icon="fa-solid fa-graduation-cap" k="Education">{pr.education || 'Any'}</Kv></div>
      <div><Kv icon="fa-solid fa-location-dot" k="Location">{pr.location || 'Any'}</Kv><Kv icon="fa-solid fa-people-group" k="Community">{m.community}</Kv><Kv icon="fa-solid fa-star" k="Interests">{(m.interests || []).join(', ')}</Kv></div></div></>);
  return null;
}

export function SideCards({ m, self, extra }) {
  const p = completion(m);
  return (
    <aside className="side-stack">
      <div className="card"><h3 className="card-title"><i className="fa-regular fa-user" />Profile Completion</h3>
        <Link className="completion" to={self ? '/my-profile' : `/profile/${m.id}/details`}><Ring p={p} /><div><b>Profile Completion</b><small>{p >= 90 ? 'Excellent!' : p >= 75 ? 'Great! Almost there.' : 'Add more details'}</small></div><i className="fa-solid fa-chevron-right" /></Link></div>
      {extra}
      <div className="card"><h3 className="card-title"><i className="fa-solid fa-shield-halved" />Verification Status</h3><VerifyList idType={m.idProof?.type || 'ID proof'} /></div>
    </aside>
  );
}
