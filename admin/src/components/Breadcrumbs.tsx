import { useLocation, Link } from 'react-router-dom';
import { colors } from '../theme';

const pageNames: Record<string, string> = {
  '': 'Overview',
  analytics: 'Analytics',
  users: 'Users',
  commits: 'Commits',
  logs: 'Logs',
  settings: 'Settings',
  reports: 'Reports',
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname
    .replace(/^\/admin\/?/, '')
    .split('/')
    .filter(Boolean);
  const currentPage = segments[0] || '';

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
        fontSize: '0.85rem',
      }}
    >
      <Link to="" style={{ color: colors.textDim, textDecoration: 'none' }}>
        Admin
      </Link>
      {currentPage && (
        <>
          <span style={{ color: colors.textDim, opacity: 0.4 }}>/</span>
          <span style={{ color: colors.text, fontWeight: 500 }}>
            {pageNames[currentPage] || currentPage}
          </span>
        </>
      )}
    </nav>
  );
}
