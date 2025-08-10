import React, { useState, useEffect } from 'react';

interface FacebookConnectionTestProps {
  onClose: () => void;
}

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

const FacebookConnectionTest: React.FC<FacebookConnectionTestProps> = ({ onClose }) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [facebookConfig, setFacebookConfig] = useState<any>(null);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    // Load Facebook config from localStorage
    try {
      const savedConfig = localStorage.getItem('simpleFacebookConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setFacebookConfig(config);
      }
    } catch (error) {
      console.error('Error loading Facebook config:', error);
    }
  }, []);

  const runTests = async () => {
    if (!facebookConfig || !facebookConfig.connected) {
      alert('Please connect to Facebook first!');
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    const tests: TestResult[] = [
      { test: 'Loading Facebook Configuration', status: 'pending', message: 'Checking saved credentials...' },
      { test: 'Testing API Connection', status: 'pending', message: 'Verifying Facebook API access...' },
      { test: 'Fetching User Information', status: 'pending', message: 'Getting your Facebook user info...' },
      { test: 'Loading Facebook Pages', status: 'pending', message: 'Retrieving your Facebook pages...' },
      { test: 'Testing Page Content Access', status: 'pending', message: 'Checking page content permissions...' }
    ];

    // Test 1: Check Configuration
    tests[0].status = 'success';
    tests[0].message = `✅ App ID: ${facebookConfig.appId}, Token: ${facebookConfig.accessToken ? '✓' : '✗'}`;
    tests[0].data = { appId: facebookConfig.appId, hasToken: !!facebookConfig.accessToken };
    setTestResults([...tests]);
    await delay(1000);

    // Test 2: API Connection
    try {
      const connectionResponse = await fetch(`${API_BASE}/api/simple-facebook?action=test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: facebookConfig.appId,
          accessToken: facebookConfig.accessToken,
          appSecret: facebookConfig.appSecret
        })
      });

      const connectionData = await connectionResponse.json();

      if (connectionData.success) {
        const pageCount = connectionData.pages ? connectionData.pages.length : 0;
        tests[1].status = 'success';
        tests[1].message = `✅ Connected! Found ${pageCount} Facebook pages`;
        tests[1].data = connectionData;
      } else {
        tests[1].status = 'error';
        tests[1].message = `❌ Connection failed: ${connectionData.error}`;
      }
    } catch (error) {
      tests[1].status = 'error';
      tests[1].message = `❌ API Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    setTestResults([...tests]);
    await delay(1500);

    // Test 3: User Information - use test-connection to get user info
    try {
      const userResponse = await fetch(`${API_BASE}/api/simple-facebook?action=test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: facebookConfig.appId,
          accessToken: facebookConfig.accessToken
        })
      });
      const userData = await userResponse.json();

      if (userData.success && userData.user) {
        tests[2].status = 'success';
        tests[2].message = `✅ User: ${userData.user.name} (ID: ${userData.user.id})`;
        tests[2].data = userData.user;
      } else {
        tests[2].status = 'error';
        tests[2].message = `❌ Failed to get user info: ${userData.error}`;
      }
    } catch (error) {
      tests[2].status = 'error';
      tests[2].message = `❌ User info error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    setTestResults([...tests]);
    await delay(1000);

    // Test 4: Facebook Pages
    const savedPages = localStorage.getItem('facebookPages');
    if (savedPages) {
      try {
        const pages = JSON.parse(savedPages);
        tests[3].status = 'success';
        tests[3].message = `✅ Found ${pages.length} pages: ${pages.map((p: any) => p.name).join(', ')}`;
        tests[3].data = pages;
      } catch (error) {
        tests[3].status = 'error';
        tests[3].message = '❌ Error parsing saved pages';
      }
    } else {
      tests[3].status = 'error';
      tests[3].message = '❌ No pages found in local storage';
    }
    setTestResults([...tests]);
    await delay(1000);

    // Test 5: Page Content (if we have pages)
    const pages = savedPages ? JSON.parse(savedPages) : [];
    if (pages.length > 0) {
      try {
        const testPage = pages[0];
        const contentResponse = await fetch(`${API_BASE}/api/simple-facebook?action=page-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: testPage.id,
            accessToken: facebookConfig.accessToken,
            limit: 5
          })
        });

        const contentData = await contentResponse.json();

        if (contentData.success) {
          const { posts, photos, videos } = contentData.content;
          tests[4].status = 'success';
          tests[4].message = `✅ Page "${testPage.name}": ${posts.length} posts, ${photos.length} photos, ${videos.length} videos`;
          tests[4].data = contentData.content;
        } else {
          tests[4].status = 'error';
          tests[4].message = `❌ Content access failed: ${contentData.error}`;
        }
      } catch (error) {
        tests[4].status = 'error';
        tests[4].message = `❌ Content test error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    } else {
      tests[4].status = 'error';
      tests[4].message = '❌ No pages available for content testing';
    }

    setTestResults([...tests]);
    setIsRunning(false);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'success': return '#27ae60';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="meta-integration-overlay">
      <div className="meta-integration-modal" style={{ maxWidth: '600px' }}>
        <div className="meta-integration-header">
          <h2>🧪 Facebook Connection Test</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="meta-integration-content">
          <div className="test-info">
            <h3>🔍 Connection Status Check</h3>
            <p>This will verify that your Facebook integration is working correctly.</p>
            
            {!facebookConfig || !facebookConfig.connected ? (
              <div className="error-message">
                <p>❌ <strong>No Facebook connection found!</strong></p>
                <p>Please connect to Facebook first using the main Facebook integration page.</p>
              </div>
            ) : (
              <div className="connection-info">
                <p>✅ <strong>Facebook Config Found:</strong></p>
                <ul>
                  <li>App ID: {facebookConfig.appId}</li>
                  <li>Access Token: {facebookConfig.accessToken ? '✓ Present' : '✗ Missing'}</li>
                  <li>Connected: {facebookConfig.connected ? 'Yes' : 'No'}</li>
                </ul>
              </div>
            )}
          </div>

          <div className="test-controls">
            <button
              className="connect-btn"
              onClick={runTests}
              disabled={isRunning || !facebookConfig?.connected}
              style={{ marginBottom: '20px', width: '100%' }}
            >
              {isRunning ? '🔄 Running Tests...' : '🧪 Run Connection Tests'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="test-results">
              <h4>📊 Test Results:</h4>
              <div className="results-list">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="test-result-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px',
                      margin: '5px 0',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${getStatusColor(result.status)}20`
                    }}
                  >
                    <span style={{ fontSize: '20px', marginRight: '10px' }}>
                      {getStatusIcon(result.status)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <strong>{result.test}</strong>
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
                        {result.message}
                      </p>
                      {result.data && (
                        <details style={{ marginTop: '5px', fontSize: '12px' }}>
                          <summary>Show Details</summary>
                          <pre style={{
                            background: 'rgba(0,0,0,0.2)',
                            padding: '10px',
                            borderRadius: '4px',
                            marginTop: '5px',
                            overflow: 'auto',
                            maxHeight: '150px'
                          }}>
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="test-summary">
            <h4>📋 What These Tests Check:</h4>
            <ul style={{ fontSize: '14px', opacity: 0.9 }}>
              <li><strong>Configuration:</strong> Your saved Facebook credentials</li>
              <li><strong>API Connection:</strong> Can we reach Facebook's API?</li>
              <li><strong>User Information:</strong> Can we get your Facebook profile?</li>
              <li><strong>Facebook Pages:</strong> Can we list your managed pages?</li>
              <li><strong>Page Content:</strong> Can we access posts, photos, and videos?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookConnectionTest;
