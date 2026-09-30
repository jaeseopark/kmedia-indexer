import { useState } from 'react';
import { apiCall } from '../hooks/api';
import styles from '../styles/global.module.css';

interface UpdateProviderFormProps {
  onSuccess: () => void;
}

export function UpdateProviderForm({ onSuccess }: UpdateProviderFormProps) {
  const [provider, setProvider] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

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

      setMessage({ type: 'success', text: `Provider ${provider} updated successfully` });
      setProvider('');
      setBaseUrl('');
      setDescription('');
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

  return (
    <div className={styles.card}>
      <h2>Update Provider</h2>

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
            disabled={loading}
            required
          />
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

        <button
          type="submit"
          className={styles.button}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Provider'}
        </button>
      </form>
    </div>
  );
}
