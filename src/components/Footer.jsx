import { Link } from 'react-router-dom';
import { Brand, NAV } from './Header';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <Brand footer />
        <div className="foot-mid">
          <div className="foot-links">{NAV.map(([n, to]) => <Link key={to} to={to}>{n}</Link>)}</div>
          <div className="foot-copy">© {new Date().getFullYear()} Family Apostolate, Thrissur Archdiocese. All Rights Reserved.</div>
        </div>
        <div className="social">
          <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook" /></a>
          <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
          <a href="#" aria-label="YouTube"><i className="fa-brands fa-youtube" /></a>
        </div>
      </div>
      <svg className="foot-art" viewBox="0 0 240 80" fill="none" stroke="#f6c9d1" strokeWidth="1.3" aria-hidden="true">
        <path d="M0 70 C40 72 60 60 78 60 C90 60 92 48 84 44 C78 41 72 46 76 52 C72 46 64 43 60 48 C55 55 70 64 78 70 C100 76 130 74 150 72 L240 72" />
        <path d="M160 72 V44 L176 30 L192 44 V72 M176 30 V12 M170 18 H182 M170 72 V58 H182 V72" />
        <path d="M200 72 V54 L212 44 L224 54 V72 M212 44 V34 M208 38 H216" />
      </svg>
    </footer>
  );
}
