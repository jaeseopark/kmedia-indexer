import styles from '../styles/global.module.css';

interface HealthStatsProps {
  count: number;
  titles: string[];
  loading: boolean;
  error: string | null;
}

export function HealthStats({ count, titles, loading, error }: HealthStatsProps) {
  if (loading) {
    return <div className={styles.card}>Loading health stats...</div>;
  }

  if (error) {
    return (
      <div className={styles.card}>
        <div className={`${styles.message} ${styles.error}`}>
          <span>Failed to load health stats: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2>Health Statistics</h2>

      <div className={styles['stats-grid']}>
        <div className={styles['stat-box']}>
          <div className={styles['stat-label']}>Records (24h)</div>
          <div className={styles['stat-value']}>{count}</div>
        </div>
      </div>

      {count === 0 ? (
        <p style={{ color: '#999', textAlign: 'center' }}>
          No records in the last 24 hours
        </p>
      ) : (
        <div>
          <h3>Latest Titles</h3>
          <ul className={styles.list}>
            {titles.map((title, index) => (
              <li key={index}>
                <strong>{index + 1}.</strong> {title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
