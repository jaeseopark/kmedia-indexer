import { useEffect, useState } from 'react';
import { LoginPage } from '../components/LoginPage';
import { DashboardPage } from './DashboardPage';
import styles from '../styles/global.module.css';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated by trying to fetch a protected endpoint
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/v1/stats', { method: 'GET' });
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>
        <div style={{ fontSize: '18px', color: '#999' }}>Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardPage /> : <LoginPage />;
}
