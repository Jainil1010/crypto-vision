import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components//Navbar';
import Footer from './components//Footer';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Context
import { AuthProvider } from './context/AuthContext.js';

// Styles
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
          <Footer />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(26, 26, 46, 0.9)',
                color: '#fff',
                border: '1px solid #334155',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;