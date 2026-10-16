import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { fmt } from '../../lib/utils';
import PageHero from '../../components/PageHero';
import { Loading } from '../../components/ui';

export function MagazineSidebar({ articles, cat }) {
  const cats = [...new Set(articles.map((a) => a.category))];
  return (
    <aside className="side-stack">
      <div className="card"><h3 className="card-title"><i className="fa-solid fa-layer-group" />Categories</h3>
        <div className="cat-list">{['All', ...cats].map((c) => (
          <Link key={c} to={c === 'All' ? '/magazine' : `/magazine?cat=${encodeURIComponent(c)}`} className={c === cat ? 'on' : ''}><span>{c}</span><b>{c === 'All' ? articles.length : articles.filter((a) => a.category === c).length}</b></Link>
        ))}</div></div>
      <div className="card"><h3 className="card-title"><i className="fa-regular fa-clock" />Recent Articles</h3>
        {articles.slice(0, 4).map((a) => <Link key={a.id} className="recent" to={`/magazine/${a.id}`}><img src={a.img} alt="" /><div><b>{a.title}</b><small>{fmt(a.date)}</small></div></Link>)}</div>
      <div className="card verse-card"><i className="fa-solid fa-cross" /><q>“Love is patient, love is kind… It always protects, always trusts, always hopes, always perseveres.”</q><small>– 1 CORINTHIANS 13:4–7</small></div>
      <div className="card cta-card"><h3>Pre-Marriage Course</h3><p>Engaged? Register for the next pre-marriage course conducted by the Family Apostolate.</p><Link className="btn btn-primary btn-sm" to="/contact?subject=Pre-marriage course">Enquire Now</Link></div>
    </aside>
  );
}

export default function Magazine() {
  const [sp, setSp] = useSearchParams();
  const cat = sp.get('cat') || 'All';
  const { data: articles, loading } = useAsync(() => api.getArticles(), []);
  const hero = <PageHero crumbs={[['Home', '/'], ['Magazine']]} title="Magazine" sub="Articles, reflections and resources for a happy Catholic family life." verse="Unless the Lord builds the house, those who build it labour in vain." verseRef="PSALM 127:1" />;
  if (loading) return <main className="page">{hero}<Loading /></main>;
  const cats = [...new Set(articles.map((a) => a.category))];
  const L = articles.filter((a) => cat === 'All' || a.category === cat), f = L[0];
  return (
    <main className="page">
      {hero}
      <div className="container content-layout">
        <section>
          <div className="cat-bar">{['All', ...cats].map((c) => <button key={c} className={c === cat ? 'on' : ''} onClick={() => setSp(c === 'All' ? {} : { cat: c })}>{c}</button>)}</div>
          {f && (
            <Link className="card feat-art" to={`/magazine/${f.id}`}><img src={f.img} alt="" />
              <div><span className="chip">{f.category}</span><h2>{f.title}</h2><p>{f.summary}</p>
                <small className="muted"><i className="fa-regular fa-calendar" /> {fmt(f.date)} &nbsp;•&nbsp; {f.read || 4} min read</small>
                <span className="read-more">Read article <i className="fa-solid fa-arrow-right" /></span></div></Link>
          )}
          <div className="art-grid">
            {L.slice(1).map((a) => (
              <Link key={a.id} className="card art" to={`/magazine/${a.id}`}><img src={a.img} alt="" />
                <div><span className="chip">{a.category}</span><h3>{a.title}</h3><p>{a.summary}</p><small className="muted">{fmt(a.date)} • {a.read || 4} min read</small></div></Link>
            ))}
          </div>
        </section>
        <MagazineSidebar articles={articles} cat={cat} />
      </div>
    </main>
  );
}
