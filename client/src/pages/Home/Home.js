import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  Wallet, 
  Bitcoin,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <TrendingUp size={24} />,
      title: 'Real-Time Trading',
      description: 'Execute trades instantly with real-time market data and advanced order types.'
    },
    {
      icon: <Shield size={24} />,
      title: 'Secure & Decentralized',
      description: 'Built on blockchain technology ensuring maximum security and transparency.'
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Advanced Analytics',
      description: 'Comprehensive charts and analytics tools for informed trading decisions.'
    },
    {
      icon: <Zap size={24} />,
      title: 'Lightning Fast',
      description: 'Experience ultra-low latency trading with our optimized infrastructure.'
    }
  ];

  const stats = [
    { value: '$2.5M+', label: 'Trading Volume' },
    { value: '10K+', label: 'Active Traders' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="hero-badge">
                <Sparkles size={16} />
                <span>Powered by Blockchain Technology</span>
              </div>
              
              <h1 className="hero-title">
                Welcome to the Future of{' '}
                <span className="gradient-text">Crypto Trading</span>
              </h1>
              
              <p className="hero-description">
                Experience the next generation of cryptocurrency trading with our secure, 
                decentralized platform. Real-time analytics, lightning-fast execution, 
                and advanced trading tools at your fingertips.
              </p>
              
              <div className="hero-actions">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="btn btn-primary hero-btn">
                    <BarChart3 size={20} />
                    Go to Dashboard
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn btn-primary hero-btn">
                      <Wallet size={20} />
                      Start Trading
                      <ArrowRight size={16} />
                    </Link>
                    <Link to="/login" className="btn btn-outline hero-btn">
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
          
          <div className="hero-visual">
            <motion.div 
              className="hero-card"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="crypto-chart">
                <div className="chart-header">
                  <Bitcoin className="chart-icon" />
                  <div>
                    <h3>BTC/USD</h3>
                    <p className="chart-price">$43,256.89</p>
                  </div>
                  <div className="chart-change positive">
                    +5.23%
                  </div>
                </div>
                <div className="chart-visual">
                  <svg width="300" height="120" viewBox="0 0 300 120">
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(34, 211, 238, 0.3)" />
                        <stop offset="100%" stopColor="rgba(34, 211, 238, 0.0)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,80 Q75,20 150,40 T300,30"
                      stroke="#22D3EE"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M0,80 Q75,20 150,40 T300,30 L300,120 L0,120 Z"
                      fill="url(#chartGradient)"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <motion.div 
            className="stats-grid"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <h3 className="stat-value gradient-text">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">
              Why Choose <span className="gradient-text">CryptoVision</span>?
            </h2>
            <p className="section-description">
              Built with cutting-edge technology and designed for both beginners and professionals
            </p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="cta-card card">
              <h2 className="cta-title">
                Ready to Start Your <span className="gradient-text">Crypto Journey</span>?
              </h2>
              <p className="cta-description">
                Join thousands of traders who trust CryptoVision for their cryptocurrency trading needs. 
                Get started in minutes with our easy onboarding process.
              </p>
              <div className="cta-features">
                <div className="cta-feature">
                  <CheckCircle size={16} />
                  <span>No hidden fees</span>
                </div>
                <div className="cta-feature">
                  <CheckCircle size={16} />
                  <span>Bank-grade security</span>
                </div>
                <div className="cta-feature">
                  <CheckCircle size={16} />
                  <span>24/7 customer support</span>
                </div>
              </div>
              {!isAuthenticated && (
                <div className="cta-actions">
                  <Link to="/register" className="btn btn-primary">
                    Create Free Account
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;