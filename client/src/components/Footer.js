import React from 'react';
import { motion } from 'framer-motion';
import { Bitcoin, Github, Twitter, Linkedin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Logo & Description */}
          <div className="footer-section">
            <motion.div 
              className="footer-logo"
              whileHover={{ scale: 1.05 }}
            >
              <Bitcoin className="footer-logo-icon" />
              <span className="footer-logo-text gradient-text">CryptoVision</span>
            </motion.div>
            <p className="footer-description">
              Your gateway to the future of cryptocurrency trading. 
              Secure, fast, and intelligent blockchain-based trading platform.
            </p>
            <div className="social-links">
              <motion.a 
                href="#" 
                className="social-link"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Twitter size={18} />
              </motion.a>
              <motion.a 
                href="#" 
                className="social-link"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Github size={18} />
              </motion.a>
              <motion.a 
                href="#" 
                className="social-link"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Linkedin size={18} />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="footer-title">Platform</h4>
            <ul className="footer-links">
              <li><a href="/trading" className="footer-link">Trading</a></li>
              <li><a href="/portfolio" className="footer-link">Portfolio</a></li>
              <li><a href="/dashboard" className="footer-link">Dashboard</a></li>
              <li><a href="/markets" className="footer-link">Markets</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <h4 className="footer-title">Resources</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Documentation</a></li>
              <li><a href="#" className="footer-link">API</a></li>
              <li><a href="#" className="footer-link">Support</a></li>
              <li><a href="#" className="footer-link">FAQ</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-section">
            <h4 className="footer-title">Company</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">About</a></li>
              <li><a href="#" className="footer-link">Blog</a></li>
              <li><a href="#" className="footer-link">Careers</a></li>
              <li><a href="#" className="footer-link">Contact</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer-section">
            <h4 className="footer-title">Stay Updated</h4>
            <p className="newsletter-text">
              Get the latest crypto insights and platform updates.
            </p>
            <form className="newsletter-form">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="newsletter-input"
              />
              <motion.button 
                type="submit"
                className="newsletter-btn btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Subscribe
              </motion.button>
            </form>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="footer-copyright">
              <p>&copy; 2025 CryptoVision. All rights reserved.</p>
            </div>
            <div className="footer-legal">
              <a href="#" className="legal-link">Privacy Policy</a>
              <a href="#" className="legal-link">Terms of Service</a>
              <a href="#" className="legal-link">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;