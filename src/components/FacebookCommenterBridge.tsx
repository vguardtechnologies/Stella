// Facebook Social Commenter Integration Component
// Automatically syncs existing Facebook connection with social commenter

import React, { useState, useEffect } from 'react';

interface FacebookCommenterBridgeProps {
  onComplete?: (success: boolean) => void;
}

const FacebookCommenterBridge: React.FC<FacebookCommenterBridgeProps> = ({ onComplete }) => {
  const [status, setStatus] = useState<'checking' | 'syncing' | 'complete' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    syncFacebookConnection();
  }, []);

  const syncFacebookConnection = async () => {
    setStatus('checking');
    setMessage('Checking existing Facebook connection...');

    try {
      // Check for existing Facebook connections
      const facebookConnection = localStorage.getItem('facebookConnection');
      const simpleFacebookConfig = localStorage.getItem('simpleFacebookConfig');
      
      if (!facebookConnection && !simpleFacebookConfig) {
        setStatus('error');
        setMessage('No Facebook connection found. Please connect Facebook first.');
        onComplete?.(false);
        return;
      }

      let connectionData = null;
      
      if (facebookConnection) {
        connectionData = JSON.parse(facebookConnection);
      } else if (simpleFacebookConfig) {
        const config = JSON.parse(simpleFacebookConfig);
        connectionData = {
          connected: true,
          accessToken: config.accessToken,
          appId: config.appId,
          accountInfo: {
            name: 'Facebook Business Account',
            handle: '@business'
          }
        };
      }

      if (connectionData?.connected || connectionData?.accessToken) {
        setStatus('syncing');
        setMessage('Syncing Facebook with comment management system...');

        // Sync Facebook
        await syncPlatform('facebook', connectionData, 'Facebook Pages');
        
        // Sync Instagram (uses same Facebook token)
        await syncPlatform('instagram', connectionData, 'Instagram Business');

        setStatus('complete');
        const platforms = ['Facebook', 'Instagram'];
        setConnectedPlatforms(platforms);
        setMessage(`Successfully connected: ${platforms.join(', ')}`);
        onComplete?.(true);
      } else {
        setStatus('error');
        setMessage('Facebook connection data is invalid.');
        onComplete?.(false);
      }
    } catch (error) {
      console.error('Facebook sync error:', error);
      setStatus('error');
      setMessage('Failed to sync Facebook connection.');
      onComplete?.(false);
    }
  };

  const syncPlatform = async (platformType: string, connectionData: any, displayName: string) => {
    const response = await fetch('/api/social-commenter?action=connect-platform', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platformType,
        name: displayName,
        accountInfo: connectionData.accountInfo || {
          name: displayName,
          handle: `@${platformType}`,
          appId: connectionData.appId
        },
        accessToken: connectionData.accessToken
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync ${displayName}`);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking': return '🔍';
      case 'syncing': return '🔄';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '🔍';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking': return '#007acc';
      case 'syncing': return '#ff9800';
      case 'complete': return '#4caf50';
      case 'error': return '#f44336';
      default: return '#007acc';
    }
  };

  return (
    <div style={{
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '24px',
        marginBottom: '16px'
      }}>
        {getStatusIcon()}
      </div>
      
      <h3 style={{
        color: getStatusColor(),
        margin: '0 0 12px 0',
        fontSize: '18px'
      }}>
        Facebook Integration
      </h3>
      
      <p style={{
        color: '#666',
        margin: '0 0 16px 0',
        fontSize: '14px'
      }}>
        {message}
      </p>

      {status === 'syncing' && (
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(0, 122, 204, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '50%',
            height: '100%',
            background: '#007acc',
            borderRadius: '2px',
            animation: 'slide 1.5s ease-in-out infinite'
          }} />
        </div>
      )}

      {status === 'complete' && connectedPlatforms.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(76, 175, 80, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(76, 175, 80, 0.2)'
        }}>
          <p style={{
            color: '#4caf50',
            margin: '0',
            fontSize: '13px',
            fontWeight: 'bold'
          }}>
            Connected Platforms:
          </p>
          <p style={{
            color: '#666',
            margin: '4px 0 0 0',
            fontSize: '12px'
          }}>
            {connectedPlatforms.join(' • ')}
          </p>
        </div>
      )}

      {status === 'error' && (
        <button
          onClick={syncFacebookConnection}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Retry
        </button>
      )}

      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default FacebookCommenterBridge;
