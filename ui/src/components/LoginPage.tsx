import { useState } from 'react';
import { loginWithApiKey } from '../hooks/api';
import styles from '../styles/global.module.css';

export function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginWithApiKey(apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ maxWidth: '400px', margin: '100px auto' }}>
        <h2>Dashboard Login</h2>
        
        {error && (
          <div className={`${styles.message} ${styles.error}`}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <label htmlFor="api-key" className={styles.required}>
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
