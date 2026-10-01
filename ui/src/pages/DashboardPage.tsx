import { useState } from 'react';
import { logout } from '../hooks/api';
import { useHealthStats, useProviders } from '../hooks/useData';
import { IngestForm } from '../components/IngestForm';
import { HealthStats } from '../components/HealthStats';
import { ProvidersList } from '../components/ProvidersList';
import { UpdateProviderForm } from '../components/UpdateProviderForm';
import styles from '../styles/global.module.css';

type Tab = 'dashboard' | 'ingest' | 'providers';

interface Provider {
  provider: string;
  base_url: string;
  description?: string;
}

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  const healthStats = useHealthStats();
  const providers = useProviders();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
  };

  return (
    <div>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <div className={styles['header-actions']}>
          <button className={styles.button} onClick={handleRefresh}>
            Refresh
          </button>
          <button className={`${styles.button} ${styles.secondary}`} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.tabs}>
          <button
            className={`${styles['tab-button']} ${activeTab === 'dashboard' ? styles.active : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`${styles['tab-button']} ${activeTab === 'ingest' ? styles.active : ''}`}
            onClick={() => setActiveTab('ingest')}
          >
            Ingest
          </button>
          <button
            className={`${styles['tab-button']} ${activeTab === 'providers' ? styles.active : ''}`}
            onClick={() => setActiveTab('providers')}
          >
            Providers
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            <HealthStats
              count={healthStats.stats?.count || 0}
              titles={healthStats.stats?.titles || []}
              loading={healthStats.loading}
              error={healthStats.error}
            />
          </>
        )}

        {activeTab === 'ingest' && <IngestForm />}

        {activeTab === 'providers' && (
          <>
            <UpdateProviderForm 
              onSuccess={handleRefresh} 
              editingProvider={editingProvider}
              onEditingChange={setEditingProvider}
            />
            <ProvidersList
              providers={providers.providers}
              loading={providers.loading}
              error={providers.error}
              onRefresh={handleRefresh}
              onEdit={handleEditProvider}
              editingProvider={editingProvider}
            />
          </>
        )}
      </div>
    </div>
  );
}
