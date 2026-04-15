import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function SignupPage() {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        phone_number: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (userData.password !== userData.confirmPassword) {
            return toast.error('Passwords do not match');
        }

        setLoading(true);
        try {
            await signup(userData);
            toast.success('Account created! Please login.');
            navigate('/login');
        } catch (err) {
            const errorMsg = err.response?.data?.username?.[0] || 'Failed to create account';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="aurora-bg"></div>
            
            <div className="auth-container">
                {/* Left Panel - Hero */}
                <div className="auth-hero-panel">
                    <img src="/assets/auth_bg.png" alt="EchoSign Community" className="auth-hero-image" />
                    <div className="auth-hero-overlay"></div>
                    <div className="auth-hero-content">
                        <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>🤝</span>
                        <h1>Join the <span className="gradient-text">Movement</span></h1>
                        <p>Create an account to join thousands of users breaking communication barriers every day.</p>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="auth-form-panel">
                    <div className="auth-form-header">
                        <h2>Create <span className="logo-accent">Account</span></h2>
                        <p>Start your journey with EchoSign today.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group-custom">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                className="input-custom"
                                value={userData.username}
                                onChange={handleChange}
                                placeholder="Pick a username"
                                required
                            />
                        </div>
                        
                        <div className="auth-grid">
                            <div className="form-group-custom">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="input-custom"
                                    value={userData.email}
                                    onChange={handleChange}
                                    placeholder="name@mail.com"
                                    required
                                />
                            </div>
                            <div className="form-group-custom">
                                <label>Phone (Optional)</label>
                                <input
                                    type="text"
                                    name="phone_number"
                                    className="input-custom"
                                    value={userData.phone_number}
                                    onChange={handleChange}
                                    placeholder="+91..."
                                />
                            </div>
                        </div>

                        <div className="auth-grid">
                            <div className="form-group-custom">
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="input-custom"
                                    value={userData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="form-group-custom">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="input-custom"
                                    value={userData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button className="btn btn-cyan" type="submit" disabled={loading} style={{ marginTop: '0.5rem', minWidth: '200px' }}>
                                {loading ? 'Processing...' : 'Register Account'}
                            </button>
                        </div>
                    </form>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign in here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
