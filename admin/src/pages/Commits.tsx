import { useState, useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { colors, fonts } from '../theme';
import { mockCommits, branches, Commit } from '../data/mockCommits';

export function Commits() {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [showFileTree, setShowFileTree] = useState(true);

  const filteredCommits = useMemo(() => {
    if (selectedBranch === 'all') return mockCommits;
    return mockCommits.filter((c) => c.branch === selectedBranch);
  }, [selectedBranch]);

  const fileStatusIcon = (status: string) => {
    switch (status) {
      case 'added':
        return { symbol: '+', color: colors.green };
      case 'modified':
        return { symbol: 'M', color: colors.yellow };
      case 'deleted':
        return { symbol: '−', color: colors.red };
      default:
        return { symbol: '?', color: colors.textDim };
    }
  };

  const renderDiffLine = (line: string, index: number) => {
    let bg = 'transparent';
    let textColor = colors.text;
    let fontWeight: number | string = 400;

    if (line.startsWith('+++') || line.startsWith('---')) {
      fontWeight = 700;
      textColor = colors.text;
    } else if (line.startsWith('+')) {
      bg = 'rgba(74, 222, 128, 0.1)';
      textColor = colors.green;
    } else if (line.startsWith('-')) {
      bg = 'rgba(252, 165, 165, 0.1)';
      textColor = colors.red;
    } else if (line.startsWith('@@')) {
      textColor = colors.purple;
    }

    return (
      <div
        key={index}
        style={{
          display: 'flex',
          background: bg,
          minHeight: 22,
        }}
      >
        <span
          style={{
            width: 50,
            minWidth: 50,
            textAlign: 'right',
            padding: '0 10px 0 0',
            color: colors.textDim,
            fontSize: 12,
            userSelect: 'none',
            borderRight: `1px solid ${colors.border}`,
            marginRight: 12,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>
        <span
          style={{
            color: textColor,
            fontWeight,
            whiteSpace: 'pre',
            fontSize: 13,
          }}
        >
          {line}
        </span>
      </div>
    );
  };

  const selectStyle: React.CSSProperties = {
    background: colors.bgElevated,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    color: colors.text,
    padding: '10px 16px',
    fontSize: 14,
    fontFamily: fonts.sans,
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    paddingRight: 36,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237c7c96' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  };

  const cardStyle: React.CSSProperties = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    overflow: 'hidden',
  };

  return (
    <div style={{ fontFamily: fonts.sans, color: colors.text }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Commits</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 13, color: colors.textDim }}>Branch:</label>
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setSelectedCommit(null);
            }}
            style={selectStyle}
          >
            <option value="all">All branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <span style={{ fontSize: 13, color: colors.textDim }}>
            {filteredCommits.length} commit{filteredCommits.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div
          style={{
            width: selectedCommit ? '40%' : '100%',
            flexShrink: 0,
            transition: 'width 0.2s',
            ...cardStyle,
          }}
        >
          <div
            style={{
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
            }}
          >
            {filteredCommits.map((commit) => {
              const isSelected = selectedCommit?.hash === commit.hash;
              return (
                <div
                  key={commit.hash}
                  onClick={() => setSelectedCommit(isSelected ? null : commit)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                    borderLeft: isSelected
                      ? `3px solid ${colors.accent}`
                      : '3px solid transparent',
                    background: isSelected ? colors.accentGlow : 'transparent',
                    transition: 'background 0.15s, border-left 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = colors.bgElevated;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 13,
                        color: colors.accent,
                        fontWeight: 600,
                      }}
                    >
                      {commit.shortHash}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: `${colors.cyan}1a`,
                        color: colors.cyan,
                        fontWeight: 500,
                      }}
                    >
                      {commit.branch}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      marginBottom: 8,
                      lineHeight: 1.4,
                      color: colors.text,
                    }}
                  >
                    {commit.message}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      fontSize: 12,
                      color: colors.textDim,
                    }}
                  >
                    <span>{commit.author}</span>
                    <span>
                      {formatDistanceToNow(new Date(commit.date), { addSuffix: true })}
                    </span>
                    <span>
                      {commit.files.length} file{commit.files.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredCommits.length === 0 && (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: colors.textDim,
                }}
              >
                No commits found for branch "{selectedBranch}"
              </div>
            )}
          </div>
        </div>

        {selectedCommit && (
          <div
            style={{
              width: '60%',
              flexShrink: 0,
              ...cardStyle,
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                  Commit Details
                </h2>
                <button
                  onClick={() => setSelectedCommit(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.textDim,
                    cursor: 'pointer',
                    fontSize: 20,
                    padding: '4px 8px',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                {selectedCommit.message}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '8px 16px',
                  fontSize: 13,
                }}
              >
                <span style={{ color: colors.textDim }}>Hash</span>
                <span style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.accent }}>
                  {selectedCommit.hash}
                </span>

                <span style={{ color: colors.textDim }}>Author</span>
                <span>{selectedCommit.author}</span>

                <span style={{ color: colors.textDim }}>Date</span>
                <span>
                  {format(new Date(selectedCommit.date), 'MMM d, yyyy HH:mm')}
                </span>

                <span style={{ color: colors.textDim }}>Branch</span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: `${colors.cyan}1a`,
                    color: colors.cyan,
                    fontSize: 12,
                    fontWeight: 500,
                    width: 'fit-content',
                  }}
                >
                  {selectedCommit.branch}
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '16px 24px',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    margin: 0,
                    color: colors.textDim,
                  }}
                >
                  Changed Files ({selectedCommit.files.length})
                </h3>
                <button
                  onClick={() => setShowFileTree((v) => !v)}
                  style={{
                    background: colors.bgElevated,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    color: colors.textDim,
                    padding: '4px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: fonts.sans,
                  }}
                >
                  {showFileTree ? 'Hide' : 'Show'}
                </button>
              </div>

              {showFileTree && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedCommit.files.map((file, i) => {
                    const icon = fileStatusIcon(file.status);
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: colors.bgElevated,
                          fontSize: 13,
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            color: icon.color,
                            background: `${icon.color}1a`,
                            flexShrink: 0,
                          }}
                        >
                          {icon.symbol}
                        </span>
                        <span
                          style={{
                            fontFamily: fonts.mono,
                            fontSize: 12,
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {file.name}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: colors.green,
                            fontFamily: fonts.mono,
                          }}
                        >
                          +{file.additions}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: colors.red,
                            fontFamily: fonts.mono,
                          }}
                        >
                          −{file.deletions}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px' }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  margin: '0 0 12px 0',
                  color: colors.textDim,
                }}
              >
                Diff
              </h3>
              <div
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    padding: '12px 0',
                    fontFamily: fonts.mono,
                    fontSize: 13,
                    lineHeight: 1.6,
                    overflowX: 'auto',
                  }}
                >
                  {selectedCommit.diff
                    .split('\n')
                    .map((line, idx) => renderDiffLine(line, idx))}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
