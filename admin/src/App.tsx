import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Analytics } from './pages/Analytics';
import { Users } from './pages/Users';
import { Commits } from './pages/Commits';
import { Logs } from './pages/Logs';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="users" element={<Users />} />
        <Route path="commits" element={<Commits />} />
        <Route path="logs" element={<Logs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>
    </Routes>
  );
}
