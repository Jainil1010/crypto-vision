import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Menu, 
  X, 
  Bitcoin, 
  User, 
  LogOut,
  BarChart3,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <motion.div 
            className="logo-container"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bitcoin className="logo-icon" />
            <span className="logo-text gradient-text">CryptoVision</span>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-menu">
          <Link to="/" className="nav-link">
            <TrendingUp size={18} />
            Home
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="nav-link">
                <BarChart3 size={18} />
                Dashboard
              </Link>
              <Link to="/trading" className="nav-link">
                <Bitcoin size={18} />
                Trading
              </Link>
              <Link to="/portfolio" className="nav-link">
                <Wallet size={18} />
                Portfolio
              </Link>
            </>
          )}
        </div>

        {/* Auth Section */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="user-menu">
              <motion.button
                className="user-button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="user-avatar">
                  <User size={18} />
                </div>
                <span className="user-name">{user?.name}</span>
              </motion.button>

              {userMenuOpen && (
                <motion.div 
                  className="user-dropdown"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="user-info">
                    <p className="user-email">{user?.email}</p>
                    <p className="wallet-address">
                      {user?.wallet_address ? 
                        `${user.wallet_address.substring(0, 6)}...${user.wallet_address.substring(-4)}` : 
                        'No wallet'
                      }
                    </p>
                  </div>
                  <hr className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item">
                    <User size={16} />
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <LogOut size={16} />
                    Logout
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div 
        className={`mobile-menu ${isOpen ? 'open' : ''}`}
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mobile-menu-content">
          <Link to="/" className="mobile-nav-link" onClick={() => setIsOpen(false)}>
            <TrendingUp size={18} />
            Home
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="mobile-nav-link" onClick={() => setIsOpen(false)}>
                <BarChart3 size={18} />
                Dashboard
              </Link>
              <Link to="/trading" className="mobile-nav-link" onClick={() => setIsOpen(false)}>
                <Bitcoin size={18} />
                Trading
              </Link>
              <Link to="/portfolio" className="mobile-nav-link" onClick={() => setIsOpen(false)}>
                <Wallet size={18} />
                Portfolio
              </Link>
              <div className="mobile-user-info">
                <p>{user?.name}</p>
                <p className="mobile-user-email">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="mobile-nav-link logout">
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <div className="mobile-auth-buttons">
              <Link to="/login" className="btn btn-outline" onClick={() => setIsOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setIsOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;