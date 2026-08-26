/**
 * LoginPage — Authentication Screen
 * =====================================
 * Premium split-screen layout with framer-motion animations,
 * high-contrast typography, and a polished auth form.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineCpuChip } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(username, email, password);
        await login(username, password);
      } else {
        await login(username, password);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.detail || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 20 } }
  };

  const slideIn = {
    hidden: { opacity: 0, x: 40 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 80, damping: 20 } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.2 } }
  };

  return (
    <div className="login-page" style={{ background: '#000' }}>
      {/* Hero Side - Left */}
      <div 
        className="login-page__hero" 
        style={{ 
          background: 'radial-gradient(circle at top left, rgba(16, 185, 129, 0.15), #000 60%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <motion.div 
          className="login-hero-content"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          style={{ textAlign: 'left', padding: '60px', width: '100%', maxWidth: '600px' }}
        >
          <motion.div variants={fadeUp} style={{ marginBottom: '40px' }}>
            <div 
              style={{ 
                width: '64px', height: '64px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(16, 185, 129, 0.2)'
              }}
            >
              <HiOutlineCpuChip size={32} color="#10b981" />
            </div>
          </motion.div>
          
          <motion.h1 
            variants={fadeUp}
            style={{ 
              fontSize: '3.5rem', 
              fontWeight: 700, 
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#fff',
              marginBottom: '24px'
            }}
          >
            Intelligence for <br/>
            <span style={{ color: '#10b981' }}>Sales Strategy.</span>
          </motion.h1>
          
          <motion.p 
            variants={fadeUp}
            style={{ 
              fontSize: '1.15rem', 
              color: 'rgba(255, 255, 255, 0.85)', 
              lineHeight: 1.6,
              maxWidth: '480px'
            }}
          >
            Leverage Deep Q-Networks for dynamic discount optimization, 
            automated performance reports, and AI-driven content generation.
          </motion.p>
        </motion.div>
      </div>

      {/* Form Side - Right */}
      <div className="login-page__form-section" style={{ background: '#09090b' }}>
        <motion.div 
          className="login-form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isRegister ? 'register' : 'login'}
              variants={slideIn}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.95rem', marginBottom: '32px' }}>
                {isRegister
                  ? 'Sign up to access the analytics platform'
                  : 'Enter your credentials to continue'}
              </p>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="login-form__error"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="username">Username</label>
                  <input
                    id="username"
                    className="form-input"
                    type="text"
                    placeholder="e.g. jdoe123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {isRegister && (
                  <motion.div 
                    className="form-group"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="form-label" htmlFor="email">Email</label>
                    <input
                      id="email"
                      className="form-input"
                      type="email"
                      placeholder="e.g. jdoe@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </motion.div>
                )}

                <div className="form-group" style={{ marginBottom: '32px' }}>
                  <label className="form-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    className="form-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="btn btn--primary btn--lg"
                  disabled={loading}
                  style={{ width: '100%', background: '#10b981', color: '#000', fontWeight: 600, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                >
                  {loading ? (
                    <span className="spinner spinner--sm" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} />
                  ) : isRegister ? (
                    'Create Account'
                  ) : (
                    'Sign In'
                  )}
                </motion.button>
              </form>

              <div className="login-form__toggle" style={{ marginTop: '32px', color: 'rgba(255,255,255,0.6)' }}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                  }}
                  style={{ color: '#10b981', background: 'none', border: 'none', marginLeft: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  {isRegister ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
