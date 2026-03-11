import { useState, useRef, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { mockLogs, LogEntry } from '../data/mockLogs';
import { colors, fonts } from '../theme';

const levelColors: Record<LogEntry['level'], string> = {
  info: colors.green,
  warn: colors.yellow,
  error: colors.red,
  debug: colors.purple,
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

export function Logs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLevels, setActiveLevels] = useState<Set<LogEntry['level']>>(
    new Set(['info', 'warn', 'error', 'debug'])
  );
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    return mockLogs.filter((log) => {
      if (!activeLevels.has(log.level)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          log.message.toLowerCase().includes(q) ||
          log.service.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, activeLevels]);

  const levelCounts = useMemo(() => {
    const counts: Record<LogEntry['level'], number> = { info: 0, warn: 0, error: 0, debug: 0 };
    mockLogs.forEach((log) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !log.message.toLowerCase().includes(q) &&
          !log.service.toLowerCase().includes(q)
        )
          return;
      }
      counts[log.level]++;
    });
    return counts;
  }, [searchQuery]);

  const virtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 36,
    overscan: 20,
  });

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [autoScroll, filteredLogs]);

  const toggleLevel = (level: LogEntry['level']) => {
    setActiveLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveLevels(new Set(['info', 'warn', 'error', 'debug']));
  };

  return (
    <div style={{ padding: 0, fontFamily: fonts.sans }}>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: colors.text,
            margin: 0,
            marginBottom: 6,
          }}
        >
          System Logs
        </h1>
        <p style={{ color: colors.textDim, fontSize: '0.9rem', margin: 0 }}>
          Real-time log viewer with virtual scrolling
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="Search logs by message or service..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: colors.bgElevated,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: '10px 14px',
            color: colors.text,
            fontFamily: fonts.sans,
            fontSize: '0.85rem',
            flex: 1,
            minWidth: 220,
            outline: 'none',
          }}
        />

        {(['info', 'warn', 'error', 'debug'] as const).map((level) => {
          const active = activeLevels.has(level);
          const color = levelColors[level];
          return (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                border: `1px solid ${active ? color : colors.border}`,
                background: active ? `${color}15` : colors.bgElevated,
                color: active ? color : colors.textDim,
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                fontFamily: fonts.sans,
                textTransform: 'uppercase',
                transition: 'all 0.15s',
              }}
            >
              {level}
              <span
                style={{
                  background: active ? color : colors.border,
                  color: active ? colors.bg : colors.textDim,
                  padding: '1px 7px',
                  borderRadius: 8,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                {levelCounts[level]}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setAutoScroll(!autoScroll)}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: `1px solid ${autoScroll ? colors.accent : colors.border}`,
            background: autoScroll ? colors.accentGlow : colors.bgElevated,
            color: autoScroll ? colors.accent : colors.textDim,
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: fonts.sans,
          }}
        >
          Auto-scroll {autoScroll ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={clearFilters}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: `1px solid ${colors.border}`,
            background: colors.bgElevated,
            color: colors.textDim,
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: fonts.sans,
          }}
        >
          Clear Filters
        </button>
      </div>

      <div
        ref={scrollRef}
        style={{
          height: 'calc(100vh - 200px)',
          overflowY: 'auto',
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
        }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const log = filteredLogs[virtualRow.index];
            const color = levelColors[log.level];
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0 16px',
                  borderBottom: `1px solid ${colors.border}22`,
                  fontFamily: fonts.mono,
                  fontSize: '0.8rem',
                }}
              >
                <span
                  style={{
                    color: colors.textDim,
                    whiteSpace: 'nowrap',
                    minWidth: 100,
                  }}
                >
                  {formatTimestamp(log.timestamp)}
                </span>
                <span
                  style={{
                    background: `${color}26`,
                    color: color,
                    padding: '2px 10px',
                    borderRadius: 10,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    minWidth: 52,
                    textAlign: 'center',
                  }}
                >
                  {log.level}
                </span>
                <span
                  style={{
                    color: colors.cyan,
                    minWidth: 140,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {log.service}
                </span>
                <span
                  style={{
                    color: colors.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {log.message}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginTop: 12,
          padding: '10px 16px',
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          fontSize: '0.8rem',
          fontFamily: fonts.mono,
        }}
      >
        <span style={{ color: colors.textDim }}>
          Total:{' '}
          <span style={{ color: colors.text, fontWeight: 600 }}>
            {mockLogs.length}
          </span>
        </span>
        <span style={{ color: colors.textDim }}>
          Filtered:{' '}
          <span style={{ color: colors.text, fontWeight: 600 }}>
            {filteredLogs.length}
          </span>
        </span>
        <span style={{ color: colors.textDim }}>|</span>
        {(['info', 'warn', 'error', 'debug'] as const).map((level) => (
          <span key={level} style={{ color: levelColors[level] }}>
            {level.toUpperCase()}: {levelCounts[level]}
          </span>
        ))}
      </div>
    </div>
  );
}
