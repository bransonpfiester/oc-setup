import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { CommandPalette } from './CommandPalette';
import { colors } from '../theme';

export function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: 260,
          padding: '24px 32px',
          minHeight: '100vh',
          overflow: 'auto',
        }}
      >
        <Breadcrumbs />
        <Outlet />
      </main>
      <CommandPalette />
    </div>
  );
}
