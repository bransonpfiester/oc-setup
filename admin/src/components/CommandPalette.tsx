import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fonts } from '../theme';

const commands = [
  { id: 'overview', label: 'Overview', description: 'Dashboard overview with stats', path: '' },
  { id: 'analytics', label: 'Analytics', description: 'Charts and data visualization', path: 'analytics' },
  { id: 'users', label: 'Users', description: 'User management table', path: 'users' },
  { id: 'commits', label: 'Commits', description: 'Commit history and diffs', path: 'commits' },
  { id: 'logs', label: 'Logs', description: 'System log viewer', path: 'logs' },
  { id: 'settings', label: 'Settings', description: 'Configuration and preferences', path: 'settings' },
  { id: 'reports', label: 'Reports', description: 'Generate and view reports', path: 'reports' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen((prev) => !prev);
      setQuery('');
      setSelectedIndex(0);
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex].path);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '20vh',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: `1px solid ${colors.border}`,
            gap: 10,
          }}
        >
          <span style={{ color: colors.textDim, fontSize: '1.1rem' }}>⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command or search..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: colors.text,
              fontSize: '0.95rem',
              fontFamily: fonts.sans,
            }}
          />
          <kbd
            style={{
              padding: '2px 8px',
              background: colors.bgElevated,
              border: `1px solid ${colors.border}`,
              borderRadius: 4,
              fontFamily: fonts.mono,
              fontSize: '0.7rem',
              color: colors.textDim,
            }}
          >
            ESC
          </kbd>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: colors.textDim,
                fontSize: '0.9rem',
              }}
            >
              No results found
            </div>
          ) : (
            filtered.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd.path)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  borderRadius: 8,
                  background: index === selectedIndex ? colors.bgElevated : 'transparent',
                  color: colors.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{cmd.label}</div>
                  <div style={{ fontSize: '0.78rem', color: colors.textDim, marginTop: 2 }}>
                    {cmd.description}
                  </div>
                </div>
                {index === selectedIndex && (
                  <span style={{ fontSize: '0.7rem', color: colors.textDim }}>↵</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
