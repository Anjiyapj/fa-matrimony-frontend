import { Link } from 'react-router-dom';
import PageHero from '../../components/PageHero';

// TODO (before go-live): confirm the office address and map pin
const MAP_QUERY = "Archbishop's House, Thrissur, Kerala";

export default function Location() {
  return (
    <main className="page">
      <PageHero crumbs={[['Home', '/'], ['Location']]} title="Our Location" sub="Visit the Family Apostolate office – we are happy to help." verse="Come to me, all you who are weary and burdened, and I will give you rest." verseRef="MATTHEW 11:28" />
      <div className="container loc-layout">
        <section className="card map-card">
          <div className="map-frame">
            <img src="/img/map.jpg" alt="Map" className="map-fallback" />
            <iframe title="Family Apostolate, Thrissur on Google Maps" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&z=15&output=embed`} />
          </div>
          <div className="map-actions">
            <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`}><i className="fa-solid fa-diamond-turn-right" /> Get Directions</a>
            <Link className="btn btn-outline" to="/contact"><i className="fa-regular fa-envelope" /> Contact the Office</Link>
          </div>
        </section>
        <aside className="side-stack">
          <div className="card"><h3 className="card-title"><i className="fa-solid fa-location-dot" />Address</h3>
            <div className="loc-addr"><img src="/img/church.jpg" alt="" /><div><b>Family Apostolate</b><br />Archdiocese of Thrissur<br />P.B. No. 36, Thrissur<br />Kerala – 680001</div></div></div>
          <div className="card"><h3 className="card-title"><i className="fa-regular fa-clock" />Office Hours</h3>
            <ul className="hours"><li><span>Monday – Saturday</span><b>9:00 AM – 5:00 PM</b></li><li><span>Lunch break</span><b>1:00 – 2:00 PM</b></li><li><span>Sundays &amp; holidays</span><b>Closed</b></li></ul></div>
          <div className="card"><h3 className="card-title"><i className="fa-solid fa-folder-open" />Registering at the Office?</h3>
            <ul className="check-list"><li><i className="fa-solid fa-check" />ID proof (Aadhaar / Passport / Licence)</li><li><i className="fa-solid fa-check" />3 recent photos</li><li><i className="fa-solid fa-check" />Letter from your parish vicar (if available)</li><li><i className="fa-solid fa-check" />₹ 500 subscription fee</li></ul></div>
        </aside>
      </div>
    </main>
  );
}
