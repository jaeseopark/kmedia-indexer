import { useState } from 'react';
import { apiCall } from '../hooks/api';
import styles from '../styles/global.module.css';

interface Provider {
  provider: string;
  base_url: string;
  description?: string;
}

interface ProvidersListProps {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onEdit?: (provider: Provider) => void;
  editingProvider?: Provider | null;
}

export function ProvidersList({
  providers,
  loading,
  error,
  onRefresh,
  onEdit,
  editingProvider,
}: ProvidersListProps) {
  const [updatingProvider, setUpdatingProvider] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDelete = async (provider: string) => {
    if (!confirm(`Are you sure you want to deactivate ${provider}?`)) return;

    setUpdatingProvider(provider);
    setMessage(null);

    try {
      await apiCall(`/api/v1/providers/${provider}`, {
        method: 'DELETE',
      });

      setMessage({ type: 'success', text: `${provider} deactivated successfully` });
      setTimeout(onRefresh, 1000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to deactivate provider',
      });
    } finally {
      setUpdatingProvider(null);
    }
  };

  if (loading) {
    return <div className={styles.card}>Loading providers...</div>;
  }

  if (error) {
    return (
      <div className={styles.card}>
        <div className={`${styles.message} ${styles.error}`}>
          <span>Failed to load providers: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2>Magnet Providers</h2>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          <span>{message.text}</span>
        </div>
      )}

      {providers.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center' }}>No providers found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Base URL</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(provider => (
              <tr key={provider.provider}>
                <td>
                  <strong>{provider.provider}</strong>
                </td>
                <td style={{ wordBreak: 'break-all', fontSize: '12px' }}>
                  {provider.base_url}
                </td>
                <td>{provider.description || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className={`${styles.button} ${editingProvider?.provider === provider.provider ? styles.secondary : ''}`}
                      onClick={() => onEdit?.(provider)}
                      disabled={updatingProvider === provider.provider}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      {editingProvider?.provider === provider.provider ? 'Editing...' : 'Edit'}
                    </button>
                    <button
                      className={`${styles.button} ${styles.danger}`}
                      onClick={() => handleDelete(provider.provider)}
                      disabled={updatingProvider === provider.provider}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      {updatingProvider === provider.provider ? 'Removing...' : 'Deactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
