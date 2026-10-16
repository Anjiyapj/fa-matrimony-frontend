import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { fmt } from '../../lib/utils';
import PageHero from '../../components/PageHero';
import { Empty, Gallery, Loading } from '../../components/ui';
import { BASE_TABS, ProfileHeader, SideCards, TabPanel, Tabs } from '../../components/ProfileParts';
import { useProfileActions } from './useProfileActions';

export default function ProfileDetails() {
  const { id } = useParams();
  const { data: m, loading, error, reload } = useAsync(() => api.getProfile(id), [id]);
  const act = useProfileActions(m, reload);
  const [tab, setTab] = useState('basic');
  const hero = <PageHero crumbs={[['Home', '/'], ['Search', '/search'], ['Profile Details']]} title="Profile Details" sub="Here are the details of this member's profile." verse="Two are better than one, for if they fall, one will lift up the other." verseRef="ECCLESIASTES 4:9" />;
  if (loading && !m) return <main className="page">{hero}<Loading /></main>;
  if (error) return <main className="page">{hero}<div className="container" style={{ paddingBottom: 30 }}><Empty icon="fa-solid fa-user-slash" title="Profile not available">{error.message} <Link className="wine" to="/search">Back to search</Link></Empty></div></main>;
  const r = m.relation;
  return (
    <main className="page">
      {hero}
      <div className="container pd-layout">
        <aside className="card pd-left">
          <Gallery member={m} />
          {r.mutual ? <Link to={`/chat/${m.id}`} className="btn btn-primary"><i className="fa-regular fa-comments" /> Send Message</Link>
            : <button className="btn btn-primary" onClick={() => act('like')}><i className="fa-solid fa-heart" /> {r.myDecision === 'like' ? 'Liked ✓' : 'Like'}</button>}
          <button className="btn btn-outline" onClick={() => act('fav')}><i className="fa-solid fa-star" /> {r.myDecision === 'fav' ? 'Shortlisted ✓' : 'Shortlist'}</button>
          <Link to={`/profile/${m.id}`} className="btn btn-outline"><i className="fa-solid fa-id-badge" /> Profile Overview</Link>
          <button className="btn btn-outline" onClick={() => act('report')}><i className="fa-solid fa-flag" /> Report Profile</button>
        </aside>
        <section className="pd-mid">
          <div className="card" style={{ paddingBottom: 0 }}><ProfileHeader m={m} /><Tabs tabs={[...BASE_TABS, ['ver', 'fa-solid fa-shield-halved', 'Verification']]} tab={tab} setTab={setTab} /></div>
          <div className="card">
            {tab === 'ver' ? (<><h3 className="pane-title"><i className="fa-solid fa-shield-halved" />Verification</h3>
              <ul className="check-list"><li><i className="fa-solid fa-check" />Email &amp; mobile verified by OTP</li><li><i className="fa-solid fa-check" />ID proof verified by the Family Apostolate office</li><li><i className="fa-solid fa-check" />3 photos verified (passport, full-length, other)</li><li><i className="fa-solid fa-check" />Active membership (6-month plan)</li></ul></>)
              : <TabPanel m={m} tab={tab} />}
          </div>
          <div className="card about-me" style={{ margin: 0, padding: '12px 18px' }}><i className="fa-solid fa-file-lines" /><div><h4>About Me</h4>{m.about}</div></div>
        </section>
        <SideCards m={m} extra={
          <div className="card quick-info"><h3 className="card-title"><i className="fa-solid fa-gear" />Quick Info</h3>
            <div className="row"><i className="fa-regular fa-id-badge" /><span className="muted">Profile ID</span><span>{m.id}</span></div>
            <div className="row"><i className="fa-regular fa-calendar" /><span className="muted">Member Since</span><span>{fmt(m.approvedDate || m.regDate)}</span></div>
            <div className="row"><i className="fa-regular fa-eye" /><span className="muted">Profile Views</span><span>{m.views || 0}</span></div>
          </div>} />
      </div>
    </main>
  );
}
