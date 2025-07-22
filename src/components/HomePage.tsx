import React, { useState } from 'react';
import './HomePage.css';

interface HomePageProps {
  onClose: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    businessName: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to authentication system
    console.log('Sign In attempt:', {
      email: formData.email,
      password: formData.password
    });
    alert('Sign In functionality will be connected later!');
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to authentication system
    console.log('Sign Up attempt:', formData);
    alert('Sign Up functionality will be connected later!');
  };

  const handleSocialLogin = (provider: string) => {
    // TODO: Connect to social authentication
    console.log(`${provider} login attempt`);
    alert(`${provider} login will be connected later!`);
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <h1>Welcome to Stella</h1>
          <p>Your Complete Water Delivery Business Solution</p>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="home-content">
          <div className="welcome-section">
            <div className="welcome-card">
              <div className="logo-section">
                <div className="app-logo">💧</div>
                <h2>Stella</h2>
                <p className="tagline">Modern Water Delivery Management</p>
              </div>

              <div className="features-preview">
                <div className="feature-item">
                  <span className="feature-icon">💬</span>
                  <div>
                    <h4>Customer Chat</h4>
                    <p>Real-time messaging with customers</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📱</span>
                  <div>
                    <h4>WhatsApp Integration</h4>
                    <p>Connect your business WhatsApp</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🛒</span>
                  <div>
                    <h4>Order Management</h4>
                    <p>Process orders seamlessly</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <div>
                    <h4>Analytics Dashboard</h4>
                    <p>Track your business performance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-section">
            <div className="auth-container">
              <div className="auth-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('signin')}
                >
                  Sign In
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                  onClick={() => setActiveTab('signup')}
                >
                  Sign Up
                </button>
              </div>

              {activeTab === 'signin' ? (
                <form className="auth-form" onSubmit={handleSignIn}>
                  <h3>Welcome Back! 👋</h3>
                  <p>Sign in to your Stella account</p>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <div className="form-options">
                    <label className="checkbox-label">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="forgot-link">Forgot Password?</a>
                  </div>

                  <button type="submit" className="auth-btn primary">
                    Sign In 🚀
                  </button>

                  <div className="divider">
                    <span>or continue with</span>
                  </div>

                  <div className="social-buttons">
                    <button 
                      type="button" 
                      className="social-btn google"
                      onClick={() => handleSocialLogin('Google')}
                    >
                      <span className="social-icon">🔍</span>
                      Google
                    </button>
                    <button 
                      type="button" 
                      className="social-btn microsoft"
                      onClick={() => handleSocialLogin('Microsoft')}
                    >
                      <span className="social-icon">Ⓜ️</span>
                      Microsoft
                    </button>
                    <button 
                      type="button" 
                      className="social-btn apple"
                      onClick={() => handleSocialLogin('Apple')}
                    >
                      <span className="social-icon">🍎</span>
                      Apple
                    </button>
                  </div>
                </form>
              ) : (
                <form className="auth-form" onSubmit={handleSignUp}>
                  <h3>Join Stella Today! 🌟</h3>
                  <p>Create your water delivery business account</p>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="businessName">Business Name</label>
                      <input
                        type="text"
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        placeholder="Your business name"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="signupEmail">Email Address</label>
                    <input
                      type="email"
                      id="signupEmail"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Your phone number"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="signupPassword">Password</label>
                      <input
                        type="password"
                        id="signupPassword"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Create password"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm password"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-options">
                    <label className="checkbox-label">
                      <input type="checkbox" required />
                      <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
                    </label>
                  </div>

                  <button type="submit" className="auth-btn primary">
                    Create Account 🎉
                  </button>

                  <div className="divider">
                    <span>or sign up with</span>
                  </div>

                  <div className="social-buttons">
                    <button 
                      type="button" 
                      className="social-btn google"
                      onClick={() => handleSocialLogin('Google')}
                    >
                      <span className="social-icon">🔍</span>
                      Google
                    </button>
                    <button 
                      type="button" 
                      className="social-btn microsoft"
                      onClick={() => handleSocialLogin('Microsoft')}
                    >
                      <span className="social-icon">Ⓜ️</span>
                      Microsoft
                    </button>
                  </div>
                </form>
              )}

              <div className="auth-footer">
                <div className="demo-section">
                  <p>🎯 <strong>Want to try first?</strong></p>
                  <button className="demo-btn" onClick={onClose}>
                    Continue with Demo Mode
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="home-footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Product</h4>
              <ul>
                <li><a href="#">Features</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">API</a></li>
                <li><a href="#">Integrations</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Community</a></li>
                <li><a href="#">Status</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy</a></li>
                <li><a href="#">Terms</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Stella. All rights reserved. Built with ❤️ for water delivery businesses.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
