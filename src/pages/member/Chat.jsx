import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { firstName, fmt, fmtShort, fmtTime } from '../../lib/utils';
import PageHero from '../../components/PageHero';
import { Empty, Loading } from '../../components/ui';

export default function Chat() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { user, refreshSummary } = useAuth();
  const { data: matches, loading, reload: reloadMatches } = useAsync(() => api.getMatches(), []);
  const { data: liked } = useAsync(() => api.getLikedMe(), []);
  const cur = id && matches?.some((x) => x.member.id === id) ? id : matches?.[0]?.member.id;
  const { data: msgs, setData: setMsgs, reload: reloadThread } = useAsync(() => (cur ? api.getThread(cur) : Promise.resolve([])), [cur]);
  const [text, setText] = useState('');
  const box = useRef();
  useEffect(() => { if (id && matches && !matches.some((x) => x.member.id === id)) toast('Messaging opens after you both like each other ♥', 3500); }, [id, matches, toast]);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs]);
  useEffect(() => { if (msgs) { refreshSummary(); } }, [msgs, refreshSummary]);
  // light polling for new messages (the backend may replace this with websockets)
  useEffect(() => { if (!cur) return; const t = setInterval(() => { reloadThread(); }, 15000); return () => clearInterval(t); }, [cur, reloadThread]);

  const send = async (e) => {
    e.preventDefault(); const t = text.trim(); if (!t) return;
    setText('');
    try { const m = await api.sendMessage(cur, t); setMsgs((L) => [...(L || []), m]); reloadMatches(); } catch (e2) { toast(e2.message); }
  };
  const hero = <PageHero crumbs={[['Home', '/'], ['Matched Chat']]} title="Matched Chat" sub="Meaningful conversations for a faith-filled tomorrow." verse="Where two hearts seek God together, beautiful things begin." verseRef="ST. JOHN PAUL II" />;
  if (loading && !matches) return <main className="page">{hero}<Loading /></main>;
  if (!matches.length) return (
    <main className="page">{hero}<div className="container" style={{ paddingBottom: 30 }}>
      <Empty icon="fa-regular fa-comments" title="No matches yet">Messaging opens when you and another member both like each other.<br />
        {liked?.length ? <><b>{liked.length}</b> member{liked.length > 1 ? 's have' : ' has'} already liked you – <Link className="wine" to="/match">see them in Match</Link>.</> : <Link className="wine" to="/match">Start matching</Link>}</Empty></div></main>
  );
  const o = matches.find((x) => x.member.id === cur).member;
  let lastDay = '';
  return (
    <main className="page">
      {hero}
      <div className="container chat-layout">
        <aside className="card convos">
          <div className="head"><h3 className="card-title"><i className="fa-regular fa-comments" />Conversations</h3><span className="muted" style={{ fontSize: 12.5 }}>{matches.length} match{matches.length > 1 ? 'es' : ''}</span></div>
          {matches.map(({ member: p, lastMessage: lm, unread }) => (
            <div key={p.id} className={'convo' + (p.id === cur ? ' active' : '')} onClick={() => nav(`/chat/${p.id}`)}>
              <img src={p.photos[0]} alt="" />
              <div><b>{p.name}{p.id === cur && <> <i className="fa-solid fa-heart" style={{ color: 'var(--rose)', fontSize: 13 }} /></>}</b><p>{lm ? (lm.from === user.id ? 'You: ' : '') + lm.text : 'Say hello 👋'}</p></div>
              <time>{lm ? fmtShort(lm.at) : ''}</time>{unread > 0 && p.id !== cur && <span className="unread">{unread}</span>}<i className="fa-solid fa-chevron-right" />
            </div>
          ))}
        </aside>
        <section className="card thread">
          <div className="match-head">
            <img src={o.photos[0]} alt="" /><div><h4>{o.name}</h4><small>{o.age} Years &nbsp;|&nbsp; {o.location.split(',')[0]}</small><small>Roman Catholic</small></div>
            <div className="mid"><i className="fa-solid fa-heart" style={{ color: 'var(--rose)', fontSize: 20 }} /><b>It's a Match!</b>You both liked each other.<br />May God guide this conversation<br />to something beautiful.</div>
            <div style={{ textAlign: 'right' }}><h4>{user.name}</h4><small>{user.age} Years &nbsp;|&nbsp; {user.location?.split(',')[0]}</small><small>Roman Catholic</small></div>
            <img src={user.photos[0]} alt="" />
          </div>
          <div className="msgs" ref={box}>
            {!msgs ? <Loading /> : !msgs.length ? <span className="day">Say hello and introduce yourself 🙏</span> : msgs.map((x) => {
              const d = fmt(x.at), sep = d !== lastDay; lastDay = d; const mine = x.from === user.id;
              return (
                <div key={x.id} style={{ display: 'contents' }}>
                  {sep && <span className="day">{d === fmt(new Date()) ? 'Today' : d}</span>}
                  <div className={'msg' + (mine ? ' me' : '')}><img src={(mine ? user : o).photos[0]} alt="" /><div className="bubble">{x.text}</div><time>{fmtTime(x.at)}{mine && <> <i className="fa-solid fa-check-double" style={{ color: '#3b82c4' }} /></>}</time></div>
                </div>
              );
            })}
          </div>
          <form className="composer" onSubmit={send}>
            <div className="box"><i className="fa-solid fa-paperclip" /><input placeholder="Type a message..." aria-label="Message" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" /><i className="fa-regular fa-face-smile" /></div>
            <button className="send" aria-label="Send"><i className="fa-solid fa-paper-plane" /></button>
          </form>
        </section>
        <aside className="side-stack">
          <div className="card guide-card"><h3><span className="ico"><i className="fa-solid fa-hands-praying" /></span>Let Your Conversations be Respectful and Prayerful</h3><p>Take time to know each other with honesty, kindness and in God's light. Meaningful conversations can be the first step towards a Christ-centered journey together.</p></div>
          <div className="card"><h3 className="card-title"><i className="fa-solid fa-gear" />Match Actions</h3><div className="action-list">
            <Link to={`/profile/${o.id}`}><i className="fa-solid fa-user" />View {firstName(o)}'s Profile<i className="fa-solid fa-chevron-right" /></Link>
            <a href="#call" onClick={(e) => { e.preventDefault(); toast(o.contact ? `📞 ${o.contact.mobile} – please involve your families when you call.` : 'Contact not available', 5000); }}><i className="fa-solid fa-phone" />Request a Call<i className="fa-solid fa-chevron-right" /></a>
            <Link to="/magazine/AR6"><i className="fa-solid fa-shield-heart" />Safety Guidelines<i className="fa-solid fa-chevron-right" /></Link>
          </div></div>
          <div className="card verse-card"><i className="fa-solid fa-cross" /><q>“Be completely humble and gentle; be patient, bearing with one another in love.”</q><small>– EPHESIANS 4:2</small></div>
        </aside>
      </div>
    </main>
  );
}
