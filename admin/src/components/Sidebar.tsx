import { NavLink } from 'react-router-dom';
import { colors, fonts } from '../theme';

const navItems = [
  { to: '', label: 'Overview', icon: '◉' },
  { to: 'analytics', label: 'Analytics', icon: '◈' },
  { to: 'users', label: 'Users', icon: '◎' },
  { to: 'commits', label: 'Commits', icon: '⊙' },
  { to: 'logs', label: 'Logs', icon: '≡' },
  { to: 'settings', label: 'Settings', icon: '⚙' },
  { to: 'reports', label: 'Reports', icon: '▤' },
];

export function Sidebar() {
  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 260,
        background: colors.bgCard,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      <div
        style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: '1.1rem',
          color: colors.accent,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>🦀</span>
        OpenClaw
      </div>

      <nav
        style={{
          flex: 1,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === ''}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: '0.9rem',
              fontWeight: 500,
              color: isActive ? colors.accent : colors.textDim,
              background: isActive ? colors.accentGlow : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: '1.1rem', width: 20, textAlign: 'center' }}>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          padding: '16px 20px',
          borderTop: `1px solid ${colors.border}`,
          fontSize: '0.75rem',
          color: colors.textDim,
          opacity: 0.6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <kbd
            style={{
              padding: '2px 6px',
              background: colors.bgElevated,
              border: `1px solid ${colors.border}`,
              borderRadius: 4,
              fontFamily: fonts.mono,
              fontSize: '0.7rem',
            }}
          >
            ⌘K
          </kbd>
          Command Palette
        </div>
      </div>
    </aside>
  );
}
