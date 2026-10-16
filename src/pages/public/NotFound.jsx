import { Link } from 'react-router-dom';
import PageHero from '../../components/PageHero';
import { Empty } from '../../components/ui';

export default function NotFound() {
  return (
    <main className="page">
      <PageHero crumbs={[['Home', '/'], ['Not found']]} title="Page not found" sub="The page you are looking for does not exist." />
      <div className="container" style={{ padding: '10px 0 40px' }}>
        <Empty icon="fa-solid fa-compass" title="Let’s get you back"><Link className="btn btn-primary" to="/" style={{ marginTop: 12 }}>Go to Home</Link></Empty>
      </div>
    </main>
  );
}
