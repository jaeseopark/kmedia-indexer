import { useState } from 'react';
import { apiCall } from '../hooks/api';
import styles from '../styles/global.module.css';

interface IngestEntry {
  title: string;
  magnet_url: string;
  category?: string;
  size_bytes?: number;
  published_at?: string;
}

export function IngestForm() {
  const [entry, setEntry] = useState<IngestEntry>({
    title: '',
    magnet_url: '',
    category: '2000',
    size_bytes: 0,
    published_at: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setEntry(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : 0) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const payload = {
        entries: [
          {
            title: entry.title,
            magnet_url: entry.magnet_url,
            category: entry.category || '2000',
            size_bytes: entry.size_bytes || 0,
            ...(entry.published_at && { published_at: entry.published_at }),
          },
        ],
      };

      await apiCall('/api/v1/ingest', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setMessage({ type: 'success', text: 'Record ingested successfully!' });
      setEntry({
        title: '',
        magnet_url: '',
        category: '2000',
        size_bytes: 0,
        published_at: '',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to ingest record',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2>Ingest Record</h2>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles['form-group']}>
          <label htmlFor="title" className={styles.required}>
            Title
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={entry.title}
            onChange={handleChange}
            placeholder="Torrent title"
            disabled={loading}
            required
          />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="magnet_url" className={styles.required}>
            Magnet URL
          </label>
          <input
            id="magnet_url"
            type="text"
            name="magnet_url"
            value={entry.magnet_url}
            onChange={handleChange}
            placeholder="magnet:?xt=urn:btih:..."
            disabled={loading}
            required
          />
        </div>

        <div className={styles['form-row']}>
          <div className={styles['form-group']}>
            <label htmlFor="category" className={styles.required}>
              Category
            </label>
            <input
              id="category"
              type="text"
              name="category"
              value={entry.category}
              onChange={handleChange}
              placeholder="2000 (Movies) or 5000 (TV)"
              disabled={loading}
              required
            />
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="size_bytes" className={styles.required}>
              Size (bytes)
            </label>
            <input
              id="size_bytes"
              type="number"
              name="size_bytes"
              value={entry.size_bytes}
              onChange={handleChange}
              disabled={loading}
              min="0"
              required
            />
          </div>
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="published_at">Published Date (ISO 8601)</label>
          <input
            id="published_at"
            type="text"
            name="published_at"
            value={entry.published_at}
            onChange={handleChange}
            placeholder="2024-01-15T10:30:00Z"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className={styles.button}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Ingest'}
        </button>
      </form>
    </div>
  );
}
