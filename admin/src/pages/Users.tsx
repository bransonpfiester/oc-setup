import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { colors, fonts } from '../theme';
import { mockUsers, User } from '../data/mockUsers';

type SortColumn = 'name' | 'email' | 'role' | 'status' | 'lastLogin' | 'signupDate' | 'apiCalls';
type SortDirection = 'asc' | 'desc';

export function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showExport, setShowExport] = useState(false);
  const [bulkRole, setBulkRole] = useState('');

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return mockUsers;
    return mockUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'email':
          cmp = a.email.localeCompare(b.email);
          break;
        case 'role':
          cmp = a.role.localeCompare(b.role);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'lastLogin':
          cmp = new Date(a.lastLogin).getTime() - new Date(b.lastLogin).getTime();
          break;
        case 'signupDate':
          cmp = new Date(a.signupDate).getTime() - new Date(b.signupDate).getTime();
          break;
        case 'apiCalls':
          cmp = a.apiCalls - b.apiCalls;
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredUsers, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedUsers.length);
  const pageUsers = sortedUsers.slice(startIndex, endIndex);

  const handleSort = useCallback(
    (col: SortColumn) => {
      if (sortColumn === col) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(col);
        setSortDirection('asc');
      }
    },
    [sortColumn],
  );

  const toggleRow = useCallback((id: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllOnPage = useCallback(() => {
    const pageIds = pageUsers.map((u) => u.id);
    const allSelected = pageIds.every((id) => selectedRows.has(id));
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [pageUsers, selectedRows]);

  const deselectAll = useCallback(() => setSelectedRows(new Set()), []);

  const exportCsv = useCallback(() => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Last Login', 'Signup Date', 'API Calls'];
    const rows = sortedUsers.map((u) => [
      u.name,
      u.email,
      u.role,
      u.status,
      format(new Date(u.lastLogin), 'MMM d, yyyy'),
      format(new Date(u.signupDate), 'MMM d, yyyy'),
      String(u.apiCalls),
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  }, [sortedUsers]);

  const sortIndicator = (col: SortColumn) => {
    if (sortColumn !== col) return ' ⇅';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const roleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return colors.accent;
      case 'editor':
        return colors.cyan;
      case 'viewer':
        return colors.textDim;
    }
  };

  const statusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return colors.green;
      case 'inactive':
        return colors.yellow;
      case 'suspended':
        return colors.red;
    }
  };

  const allOnPageSelected =
    pageUsers.length > 0 && pageUsers.every((u) => selectedRows.has(u.id));

  const headerStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 13,
    color: colors.textDim,
    borderBottom: `1px solid ${colors.border}`,
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    background: colors.bgCard,
    zIndex: 2,
  };

  const cellStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 14,
    color: colors.text,
    borderBottom: `1px solid ${colors.border}`,
    whiteSpace: 'nowrap',
  };

  const btnStyle: React.CSSProperties = {
    background: colors.bgElevated,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    color: colors.text,
    padding: '8px 16px',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: fonts.sans,
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
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Users</h1>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button
              style={btnStyle}
              onClick={() => setShowExport((v) => !v)}
            >
              Export ▾
            </button>
            {showExport && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  background: colors.bgElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  padding: 4,
                  zIndex: 10,
                  minWidth: 160,
                }}
              >
                <button
                  style={{
                    ...btnStyle,
                    width: '100%',
                    border: 'none',
                    textAlign: 'left',
                    borderRadius: 8,
                    padding: '10px 14px',
                  }}
                  onClick={exportCsv}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = colors.border)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 14,
            fontFamily: fonts.sans,
            background: colors.bgElevated,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            color: colors.text,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = colors.accent)
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = colors.border)
          }
        />
      </div>

      {selectedRows.size > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            marginBottom: 16,
            background: colors.accentGlow,
            border: `1px solid ${colors.accent}`,
            borderRadius: 10,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {selectedRows.size} selected
          </span>

          <button
            style={{
              ...btnStyle,
              background: colors.red,
              color: colors.bg,
              border: 'none',
              fontWeight: 600,
            }}
            onClick={() => setSelectedRows(new Set())}
          >
            Delete Selected
          </button>

          <select
            value={bulkRole}
            onChange={(e) => setBulkRole(e.target.value)}
            style={{
              ...btnStyle,
              appearance: 'none',
              paddingRight: 32,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237c7c96' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            <option value="">Change Role…</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>

          <button style={btnStyle} onClick={deselectAll}>
            Deselect All
          </button>
        </div>
      )}

      <div
        style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto', maxHeight: 600, overflowY: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 900,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    ...headerStyle,
                    width: 48,
                    cursor: 'default',
                    textAlign: 'center',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    style={{ cursor: 'pointer', accentColor: colors.accent }}
                  />
                </th>
                <th style={headerStyle} onClick={() => handleSort('name')}>
                  Name{sortIndicator('name')}
                </th>
                <th style={headerStyle} onClick={() => handleSort('email')}>
                  Email{sortIndicator('email')}
                </th>
                <th style={headerStyle} onClick={() => handleSort('role')}>
                  Role{sortIndicator('role')}
                </th>
                <th style={headerStyle} onClick={() => handleSort('status')}>
                  Status{sortIndicator('status')}
                </th>
                <th style={headerStyle} onClick={() => handleSort('lastLogin')}>
                  Last Login{sortIndicator('lastLogin')}
                </th>
                <th style={headerStyle} onClick={() => handleSort('signupDate')}>
                  Signup Date{sortIndicator('signupDate')}
                </th>
                <th style={headerStyle} onClick={() => handleSort('apiCalls')}>
                  API Calls{sortIndicator('apiCalls')}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.map((user, idx) => {
                const isSelected = selectedRows.has(user.id);
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={user.id}
                    style={{
                      background: isSelected
                        ? colors.accentGlow
                        : isEven
                          ? 'transparent'
                          : `${colors.bgElevated}44`,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = colors.bgElevated;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = isEven
                          ? 'transparent'
                          : `${colors.bgElevated}44`;
                    }}
                  >
                    <td style={{ ...cellStyle, textAlign: 'center', width: 48 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(user.id)}
                        style={{ cursor: 'pointer', accentColor: colors.accent }}
                      />
                    </td>
                    <td style={cellStyle}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontWeight: 500 }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ ...cellStyle, fontFamily: fonts.mono, fontSize: 13 }}>
                      {user.email}
                    </td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          color: roleBadgeColor(user.role),
                          background: `${roleBadgeColor(user.role)}1a`,
                          textTransform: 'capitalize',
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: statusColor(user.status),
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            color: statusColor(user.status),
                            textTransform: 'capitalize',
                            fontSize: 13,
                          }}
                        >
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...cellStyle, fontSize: 13 }}>
                      {format(new Date(user.lastLogin), 'MMM d, yyyy')}
                    </td>
                    <td style={{ ...cellStyle, fontSize: 13 }}>
                      {format(new Date(user.signupDate), 'MMM d, yyyy')}
                    </td>
                    <td style={{ ...cellStyle, fontFamily: fonts.mono, fontSize: 13 }}>
                      {user.apiCalls.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {pageUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      ...cellStyle,
                      textAlign: 'center',
                      padding: '40px 16px',
                      color: colors.textDim,
                    }}
                  >
                    No users found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: `1px solid ${colors.border}`,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: colors.textDim }}>
            Showing {sortedUsers.length === 0 ? 0 : startIndex + 1}–{endIndex} of{' '}
            {sortedUsers.length} users
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: colors.textDim }}>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  background: colors.bgElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                  padding: '6px 10px',
                  fontSize: 13,
                  fontFamily: fonts.sans,
                  cursor: 'pointer',
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <span style={{ fontSize: 13, color: colors.textDim }}>
              Page {safeCurrentPage} of {totalPages}
            </span>

            <button
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                ...btnStyle,
                opacity: safeCurrentPage <= 1 ? 0.4 : 1,
                cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <button
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                ...btnStyle,
                opacity: safeCurrentPage >= totalPages ? 0.4 : 1,
                cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
