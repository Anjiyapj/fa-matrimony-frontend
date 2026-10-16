import { Link } from 'react-router-dom';
import api from '../../api';
import { useAsync } from '../../lib/useAsync';
import PageHero from '../../components/PageHero';

const STEPS = [
  ['fa-solid fa-user-plus', 'Register', 'Fill in personal, family and partner details online or at our office.'],
  ['fa-solid fa-camera', 'Upload', 'At least 3 photos (passport, full length, another angle) and an ID proof.'],
  ['fa-solid fa-indian-rupee-sign', 'Subscribe', '₹ 500 for 6 months – online or at the office.'],
  ['fa-solid fa-user-check', 'Verification', 'Our office checks your details, documents and payment, then approves.'],
  ['fa-solid fa-heart', 'Match', "Swipe or tap Like / Pass. Men see women's profiles and women see men's."],
  ['fa-regular fa-comments', 'Connect', 'When you both like each other, chat opens – then involve your families.']
];
const FAQ = [
  ['Who can register?', 'Catholic men and women of marriageable age who wish to marry within the Catholic community. Parents may also register on behalf of their son or daughter.'],
  ['Why can I only see profiles of the opposite gender?', 'As per Church guidelines for this service, male members see female profiles and female members see male profiles only.'],
  ['How long does verification take?', 'Usually 2–3 working days after your documents and payment are received. You can log in once your profile is approved.'],
  ['Can I pause my profile for some time?', 'Yes. From My Profile → Account & Hold, request a hold for 1 to 6 months. Once the office approves it, your profile is hidden and your membership is extended by the same period. You can resume early at any time.'],
  ['What happens after 6 months?', 'You will receive a reminder 30 days before expiry. If you do not renew, your profile is hidden and later removed.'],
  ['We got married – what should we do?', 'Go to My Profile → Account & Hold → “I got married”. Your profile is hidden immediately and the office removes your account. We would love to hear your success story too!'],
  ['Is my information safe?', 'Contact details are shared only after a mutual match. ID proofs are seen only by the office. Never share money or OTPs with anyone.']
];

export default function About() {
  const { data: s } = useAsync(() => api.getPublicStats(), []);
  return (
    <main className="page">
      <PageHero crumbs={[['Home', '/'], ['About Us']]} title="About Us" sub="Building families, building a holy tomorrow." verse="Let all that you do be done in love." verseRef="1 CORINTHIANS 16:14" />
      <div className="container">
        <section className="card about-intro">
          <img src="/img/church.jpg" alt="Church" />
          <div>
            <div className="kicker">FAMILY APOSTOLATE • ARCHDIOCESE OF THRISSUR</div>
            <h2 className="serif wine">A Catholic matrimonial service with a pastoral heart</h2>
            <p>The Family Apostolate of the Archdiocese of Thrissur accompanies families at every stage of life – from preparing young people for marriage, to supporting couples and parents, to caring for the elderly.</p>
            <p>Family Apostolate Matrimony is part of this mission. It helps Catholic young men and women find a life partner within our own community, in a setting that is safe, verified and rooted in faith. Every profile is checked by our office before it becomes visible, and families are encouraged to be involved at every step.</p>
            <div className="about-stats">
              <div><b>{s?.members ?? '…'}</b><span>Registered members</span></div>
              <div><b>{s?.active ?? '…'}</b><span>Active profiles</span></div>
              <div><b>{s?.couples ?? '…'}</b><span>Couples united</span></div>
            </div>
          </div>
        </section>
        <section className="mv-grid">
          <div className="card mv"><span className="ico"><i className="fa-solid fa-eye" /></span><h3>Our Vision</h3><p>Every Catholic family a ‘domestic church’ – a home of prayer, love and service that builds a holy tomorrow.</p></div>
          <div className="card mv"><span className="ico"><i className="fa-solid fa-bullseye" /></span><h3>Our Mission</h3><p>To help young people discern and find a life partner who shares their faith, and to prepare and accompany couples in the sacrament of marriage.</p></div>
          <div className="card mv"><span className="ico"><i className="fa-solid fa-hands-holding-child" /></span><h3>Our Values</h3><p>Faith, honesty, respect for families, privacy and care – especially for those who need extra support.</p></div>
        </section>
        <section className="card how">
          <h2 className="serif wine sec-title"><i className="fa-solid fa-route" /> How It Works</h2>
          <div className="how-steps">{STEPS.map(([i, t, d], k) => <div key={t}><b>{k + 1}</b><i className={i} /><h4>{t}</h4><p>{d}</p></div>)}</div>
        </section>
        <section className="about-two">
          <div className="card plan-mini">
            <h3 className="serif wine">Membership</h3>
            <div className="price">₹ 500 <small>/ 6 months</small></div>
            <ul className="check-list">
              <li><i className="fa-solid fa-check" />Verified profile visible to members</li><li><i className="fa-solid fa-check" />Search, swipe, like &amp; favourites</li>
              <li><i className="fa-solid fa-check" />Chat after mutual interest</li><li><i className="fa-solid fa-check" />Pause (hold) up to 6 months</li>
              <li><i className="fa-solid fa-check" />Renewal reminder before expiry</li><li><i className="fa-solid fa-check" />Profile removed after marriage</li>
            </ul>
            <Link className="btn btn-primary btn-block" to="/register" style={{ marginTop: 14 }}><i className="fa-solid fa-heart-circle-check" /> Register Now</Link>
          </div>
          <div className="card faq">
            <h3 className="serif wine sec-title"><i className="fa-regular fa-circle-question" /> Frequently Asked Questions</h3>
            {FAQ.map(([q, a], k) => <details key={q} open={k === 0}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </section>
      </div>
    </main>
  );
}
