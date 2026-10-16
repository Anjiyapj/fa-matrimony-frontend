import { Link, useParams } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { firstName, fmt, ft } from '../../lib/utils';
import PageHero from '../../components/PageHero';
import { Empty, Gallery, Kv, Loading, Notice } from '../../components/ui';
import { SideCards } from '../../components/ProfileParts';
import { useProfileActions } from './useProfileActions';

export default function ProfileView() {
  const { id } = useParams();
  const { data: m, loading, error, reload } = useAsync(() => api.getProfile(id), [id]);
  const act = useProfileActions(m, reload);
  const hero = <PageHero crumbs={[['Home', '/'], ['Search', '/search'], ['Profile']]} title="Member Profile" sub="Getting to know each other is a step towards God's plan." verse="Two are better than one, for if they fall, one will lift up the other." verseRef="ECCLESIASTES 4:9" />;
  if (loading && !m) return <main className="page">{hero}<Loading /></main>;
  if (error) return <main className="page">{hero}<div className="container" style={{ paddingBottom: 30 }}><Empty icon="fa-solid fa-user-slash" title="Profile not available">{error.message} <Link className="wine" to="/search">Back to search</Link></Empty></div></main>;
  const r = m.relation;
  return (
    <main className="page">
      {hero}
      <div className="container profile-layout">
        <section className="card profile-card">
          <Gallery member={m} />
          <div>
            <h2 className="p-name">{m.name} <i className="fa-solid fa-shield-heart verified-ico" /></h2>
            <div className="p-meta"><span>{m.age} Years</span><span>Roman Catholic</span><span>{m.maritalStatus}</span></div>
            {r.mutual ? <Notice type="ok" icon="fa-solid fa-heart" style={{ margin: '0 0 10px' }}>You are matched! Messaging and contact details are unlocked.</Notice>
              : r.likesMe ? <Notice icon="fa-solid fa-heart" style={{ margin: '0 0 10px' }}>{firstName(m)} likes your profile. Like back to start chatting.</Notice> : null}
            <div className="quote-band">“{m.quote}”</div>
            <div className="kv-cols"><div>
              <Kv icon="fa-solid fa-cake-candles" k="Age">{m.age} Years<br /><small className="muted">({fmt(m.dob)})</small></Kv><Kv icon="fa-solid fa-church" k="Diocese">{m.diocese}</Kv>
              <Kv icon="fa-solid fa-house-chimney" k="Parish">{m.parish}</Kv><Kv icon="fa-solid fa-graduation-cap" k="Education">{m.education}</Kv><Kv icon="fa-solid fa-briefcase" k="Profession">{m.job}</Kv>
            </div><div>
              <Kv icon="fa-regular fa-heart" k="Marital Status">{m.maritalStatus}</Kv><Kv icon="fa-solid fa-ruler-vertical" k="Height">{m.height} cm ({ft(m.height)})</Kv>
              <Kv icon="fa-solid fa-people-group" k="Community">{m.community}</Kv><Kv icon="fa-solid fa-globe" k="Mother Tongue">{m.motherTongue}</Kv>
              <Kv icon="fa-regular fa-comment-dots" k="Languages">{m.languages}</Kv><Kv icon="fa-solid fa-location-dot" k="Location">{m.location}</Kv>
            </div></div>
            <div className="about-me"><i className="fa-solid fa-user" /><div><h4>About Me</h4>{m.about}</div></div>
            <div className="hobbies"><h4><i className="fa-solid fa-heart" />Hobbies &amp; Interests</h4><div className="chips">{(m.interests || []).map((x) => <span key={x} className="chip">{x}</span>)}</div></div>
          </div>
          <div className="p-actions">
            <button className="btn btn-outline" onClick={() => act('pass')}><i className="fa-solid fa-xmark" /> {r.myDecision === 'pass' ? 'Passed' : 'Pass / Not Interested'}</button>
            {r.mutual ? <Link className="btn btn-primary" to={`/chat/${m.id}`}><i className="fa-regular fa-comments" /> Send Message</Link>
              : <button className="btn btn-primary" onClick={() => act('like')}><i className="fa-solid fa-heart" /> {r.myDecision === 'like' ? 'Liked ✓' : 'Like'}</button>}
            <button className="btn btn-outline" onClick={() => act('fav')}><i className="fa-solid fa-heart" /> {r.myDecision === 'fav' ? 'In Favorites ✓' : 'Add to Favorites'}</button>
          </div>
        </section>
        <SideCards m={m} extra={
          <div className="card"><h3 className="card-title"><i className="fa-solid fa-gear" />Quick Actions</h3><div className="action-list">
            <a href="#m" onClick={(e) => { e.preventDefault(); act('msg'); }}><i className="fa-regular fa-envelope" />Send Message<i className="fa-solid fa-chevron-right" /></a>
            <a href="#c" onClick={(e) => { e.preventDefault(); act('contact'); }}><i className={'fa-solid ' + (r.mutual ? 'fa-phone' : 'fa-lock')} />{r.mutual ? 'View Contact' : 'View Contact (after match)'}<i className="fa-solid fa-chevron-right" /></a>
            <Link to={`/profile/${m.id}/details`}><i className="fa-solid fa-id-card" />Full Profile Details<i className="fa-solid fa-chevron-right" /></Link>
            <a href="#r" onClick={(e) => { e.preventDefault(); act('report'); }}><i className="fa-solid fa-flag" />Report Profile<i className="fa-solid fa-chevron-right" /></a>
            <a href="#b" onClick={(e) => { e.preventDefault(); act('block'); }}><i className="fa-solid fa-ban" />Block Member<i className="fa-solid fa-chevron-right" /></a>
          </div></div>} />
      </div>
    </main>
  );
}
