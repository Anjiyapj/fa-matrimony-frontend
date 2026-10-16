import { Fragment } from 'react';
import { Link } from 'react-router-dom';

/* crumbs: [['Home','/'], ['Magazine','/magazine'], ['Article']] */
export default function PageHero({ crumbs = [], title, sub, verse, verseRef }) {
  return (
    <section className="page-hero">
      <div className="container">
        <div className="crumbs">
          {crumbs.map(([label, to], i) => (
            <Fragment key={i}>
              {i > 0 && <i className="fa-solid fa-chevron-right" />}
              {i === crumbs.length - 1 ? <span className="cur">{label}</span> : <Link to={to}>{label}</Link>}
            </Fragment>
          ))}
        </div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
        {verse && <div className="verse-bubble"><q>{verse}</q><small>– {verseRef}</small></div>}
      </div>
    </section>
  );
}
