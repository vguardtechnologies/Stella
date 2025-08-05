import React, { useState, useEffect } from 'react';
import './ShopifyWhatsAppIntegration.css';

interface IntegrationStatus {
  inProgress: boolean;
  lastSync: string | null;
  catalogId: string | null;
  isSetup: boolean;
}

interface IntegrationProps {
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

const ShopifyWhatsAppIntegration: React.FC<IntegrationProps> = ({ onClose, onSuccess }) => {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      const response = await fetch(`${baseUrl}/api/shopify-whatsapp/integration-status`);
      const result = await response.json();
      
      if (result.success) {
        setStatus(result.data);
      }
    } catch (error) {
      console.error('Error loading integration status:', error);
    }
  };

  const setupOfficialIntegration = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      const response = await fetch(`${baseUrl}/api/shopify-whatsapp/setup-official-integration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setSetupResult(result.data);
        setStatus(prev => ({
          ...prev,
          catalogId: result.data.catalogId,
          isSetup: true,
          lastSync: new Date().toISOString(),
          inProgress: false
        }));
        onSuccess?.(result.data);
      } else {
        setError(result.message || 'Setup failed');
      }
    } catch (error) {
      console.error('Setup failed:', error);
      setError('Failed to setup integration. Please check your Shopify and WhatsApp configurations.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSync = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      const response = await fetch(`${baseUrl}/api/shopify-whatsapp/sync-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setSetupResult(result.data);
        await loadStatus(); // Reload status
      } else {
        setError(result.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setError('Failed to sync products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="shopify-whatsapp-overlay">
      <div className="shopify-whatsapp-container">
        <div className="integration-header">
          <h2>🛒📱 Shopify WhatsApp Sales Channel</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="integration-content">
          {error && (
            <div className="error-message">
              <span>❌ {error}</span>
            </div>
          )}

          {setupResult && (
            <div className="success-message">
              <h3>✅ Integration Setup Complete!</h3>
              <div className="setup-details">
                <p><strong>Catalog ID:</strong> {setupResult.catalogId}</p>
                <p><strong>Products Synced:</strong> {setupResult.productsSync}</p>
                <p><strong>Message:</strong> {setupResult.message}</p>
                <p><strong>Next Sync:</strong> {setupResult.nextSyncRecommended}</p>
              </div>
            </div>
          )}

          {status && (
            <div className="status-section">
              <h3>📊 Integration Status</h3>
              <div className="status-grid">
                <div className="status-item">
                  <span className="status-label">Setup:</span>
                  <span className={`status-value ${status.isSetup ? 'success' : 'pending'}`}>
                    {status.isSetup ? '✅ Complete' : '⏳ Not Setup'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Catalog ID:</span>
                  <span className="status-value">
                    {status.catalogId ? `${status.catalogId.slice(0, 8)}...` : '❌ None'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Last Sync:</span>
                  <span className="status-value">
                    {status.lastSync 
                      ? new Date(status.lastSync).toLocaleString() 
                      : '❌ Never'
                    }
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Sync Status:</span>
                  <span className={`status-value ${status.inProgress ? 'warning' : 'success'}`}>
                    {status.inProgress ? '🔄 In Progress' : '✅ Ready'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="integration-info">
            <h3>🎯 What This Does</h3>
            <ul>
              <li>✅ <strong>Official Integration:</strong> Creates a proper Facebook Business Manager catalog</li>
              <li>✅ <strong>Auto-Sync:</strong> Syncs all your Shopify products to WhatsApp</li>
              <li>✅ <strong>Product Messages:</strong> Enables proper WhatsApp product cards (not fallbacks)</li>
              <li>✅ <strong>Commerce Ready:</strong> Configures WhatsApp Commerce settings</li>
              <li>✅ <strong>Real-time Updates:</strong> Keeps your catalog in sync with Shopify</li>
            </ul>
          </div>

          <div className="requirements-section">
            <h3>📋 Requirements</h3>
            <div className="requirement-checks">
              <div className="requirement-item">
                <span>🛒 Shopify Store Connected</span>
                <span className="requirement-status">✅ Required</span>
              </div>
              <div className="requirement-item">
                <span>📱 WhatsApp Business API</span>
                <span className="requirement-status">✅ Required</span>
              </div>
              <div className="requirement-item">
                <span>👥 Facebook Business Manager</span>
                <span className="requirement-status">✅ Auto-configured</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            {!status?.isSetup ? (
              <button 
                className="setup-button primary"
                onClick={setupOfficialIntegration}
                disabled={isLoading}
              >
                {isLoading ? '🔄 Setting up...' : '🚀 Setup Official Integration'}
              </button>
            ) : (
              <div className="setup-actions">
                <button 
                  className="sync-button secondary"
                  onClick={triggerSync}
                  disabled={isLoading || status.inProgress}
                >
                  {isLoading ? '🔄 Syncing...' : '🔄 Sync Products Now'}
                </button>
                <button 
                  className="setup-button primary"
                  onClick={setupOfficialIntegration}
                  disabled={isLoading}
                >
                  {isLoading ? '🔄 Re-configuring...' : '⚙️ Re-configure Integration'}
                </button>
              </div>
            )}
          </div>

          <div className="help-section">
            <h4>💡 Need Help?</h4>
            <p>
              This integration automatically creates a Facebook Business Manager catalog 
              and syncs your Shopify products. Once complete, your WhatsApp product 
              messages will display properly instead of falling back to text.
            </p>
            <p>
              <strong>Note:</strong> Make sure your Shopify store and WhatsApp Business API 
              are properly configured before running the setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopifyWhatsAppIntegration;
