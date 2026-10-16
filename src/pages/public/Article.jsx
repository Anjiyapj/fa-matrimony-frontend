import { Link, useParams } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import { fmt } from '../../lib/utils';
import PageHero from '../../components/PageHero';
import { Empty, Loading } from '../../components/ui';
import { MagazineSidebar } from './Magazine';

export default function Article() {
  const { id } = useParams();
  const { data: articles, loading } = useAsync(() => api.getArticles(), []);
  const art = articles?.find((a) => a.id === id);
  const i = articles?.indexOf(art), prev = articles?.[i + 1], next = articles?.[i - 1];
  return (
    <main className="page">
      <PageHero crumbs={[['Home', '/'], ['Magazine', '/magazine'], [art?.category || 'Article']]} title="Magazine" sub="Articles, reflections and resources for a happy Catholic family life." verse="Unless the Lord builds the house, those who build it labour in vain." verseRef="PSALM 127:1" />
      <div className="container content-layout">
        <section>
          {loading ? <Loading /> : !art ? <Empty title="Article not found"><Link className="wine" to="/magazine">Back to Magazine</Link></Empty> : (
            <article className="card reader">
              <img className="reader-img" src={art.img} alt="" />
              <div className="reader-body"><span className="chip">{art.category}</span>
                <h1>{art.title}</h1>
                <div className="reader-meta"><span><i className="fa-regular fa-calendar" /> {fmt(art.date)}</span><span><i className="fa-regular fa-clock" /> {art.read || 4} min read</span><span><i className="fa-solid fa-pen-nib" /> Family Apostolate Desk</span></div>
                <p className="lead">{art.summary}</p>
                {(art.body || []).map((p, k) => <p key={k}>{p}</p>)}
                <div className="reader-nav">{prev ? <Link to={`/magazine/${prev.id}`}><i className="fa-solid fa-arrow-left" /> {prev.title}</Link> : <span />}{next && <Link to={`/magazine/${next.id}`}>{next.title} <i className="fa-solid fa-arrow-right" /></Link>}</div>
                <Link className="btn btn-outline btn-sm" to="/magazine"><i className="fa-solid fa-arrow-left" /> All Articles</Link>
              </div>
            </article>
          )}
        </section>
        {articles && <MagazineSidebar articles={articles} cat={art?.category} />}
      </div>
    </main>
  );
}
