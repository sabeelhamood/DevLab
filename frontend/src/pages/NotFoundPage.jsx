import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-bg-primary pt-16 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-text-primary mb-4">404</h1>
        <p className="text-xl text-text-secondary mb-8">Page not found</p>
        <Link
          to="/"
          className="btn-primary"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;





