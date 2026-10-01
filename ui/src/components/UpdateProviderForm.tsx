import { useState, useEffect } from 'react';
import { apiCall } from '../hooks/api';
import styles from '../styles/global.module.css';

interface Provider {
  provider: string;
  base_url: string;
  description?: string;
}

interface UpdateProviderFormProps {
  onSuccess: () => void;
  editingProvider?: Provider | null;
  onEditingChange?: (provider: Provider | null) => void;
}

export function UpdateProviderForm({ onSuccess, editingProvider, onEditingChange }: UpdateProviderFormProps) {
  const [provider, setProvider] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Populate form when editing a provider
  useEffect(() => {
    if (editingProvider) {
      setProvider(editingProvider.provider);
      setBaseUrl(editingProvider.base_url);
      setDescription(editingProvider.description || '');
    } else {
      setProvider('');
      setBaseUrl('');
      setDescription('');
    }
  }, [editingProvider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      await apiCall('/api/v1/providers', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          base_url: baseUrl,
          description: description || undefined,
        }),
      });

      const action = editingProvider ? 'updated' : 'created';
      setMessage({ type: 'success', text: `Provider ${provider} ${action} successfully` });
      setProvider('');
      setBaseUrl('');
      setDescription('');
      if (onEditingChange) {
        onEditingChange(null);
      }
      setTimeout(onSuccess, 1000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update provider',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProvider('');
    setBaseUrl('');
    setDescription('');
    setMessage(null);
    if (onEditingChange) {
      onEditingChange(null);
    }
  };

  return (
    <div className={styles.card}>
      <h2>{editingProvider ? 'Edit Provider' : 'Add Provider'}</h2>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles['form-group']}>
          <label htmlFor="provider" className={styles.required}>
            Provider Name
          </label>
          <input
            id="provider"
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="e.g., torrenttip"
            disabled={loading || !!editingProvider}
            required
          />
          {editingProvider && (
            <small style={{ color: '#999', marginTop: '4px', display: 'block' }}>
              Provider name cannot be changed during edit
            </small>
          )}
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="base_url" className={styles.required}>
            Base URL
          </label>
          <input
            id="base_url"
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={loading}
            required
          />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Saving...' : editingProvider ? 'Save Changes' : 'Add Provider'}
          </button>
          {editingProvider && (
            <button
              type="button"
              className={`${styles.button} ${styles.secondary}`}
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
