import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import CryptoJS from 'crypto-js';

const SECRET_KEY = "Kedhareswarmatha"; // Use the same key as in other components

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const encryptPassword = (password) => {
    return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
  };

  const sendResetOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      setMessage(response.data.msg);
      setShowOtpInput(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to process request');
      console.error('Send OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Encrypt the new password before sending
      const encryptedPassword = encryptPassword(newPassword);
      console.log("Encrypted Password Sent to Backend:", encryptedPassword);

      const response = await api.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword: encryptedPassword // Send encrypted password
      });

      setMessage(response.data.msg);
      // Add a slight delay before redirecting
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to reset password');
      console.error('Reset password error:', err);
      // If OTP is expired, allow requesting a new one
      if (err.response?.data?.msg?.includes('expired')) {
        setShowOtpInput(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Forgot Password</h2>
      
      {!showOtpInput ? (
        <form onSubmit={sendResetOTP}>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {message && <div className="text-green-500 mb-4">{message}</div>}
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword}>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {message && <div className="text-green-500 mb-4">{message}</div>}
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Enter 6-digit Code</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength="6"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
      
      <div className="mt-4 text-center">
        <Link to="/login" className="text-blue-500 hover:text-blue-600">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;