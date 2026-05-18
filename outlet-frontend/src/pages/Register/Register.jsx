import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Package } from 'lucide-react';
import './Rgister.css';

const Register = () => {
  const [userData, setUserData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await registerUser(userData);
      const token = res.data?.token || res.data?.data?.token || res.data?.accessToken || res.data?.data?.accessToken;
      const user = res.data?.user || res.data?.data?.user || { username: userData.username, email: userData.email, role: 'USER' };
      if (token) {
        login(user, token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-branding">
        <Package size={48} color="var(--color-primary)" />
        <h1>InventoryPro</h1>
        <p>Create your new account.</p>
      </div>

      <Card className="auth-card">
        <h2 className="auth-title">Sign Up</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleRegister}>
          <Input
            label="Username"
            name="username"
            type="text"
            value={userData.username}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={userData.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={userData.password}
            onChange={handleChange}
            required
          />
          <Button fullWidth type="submit" disabled={loading} className="mt-4">
            {loading ? 'Registering...' : 'Create Account'}
          </Button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </Card>
    </div>
  );
};

export default Register;
