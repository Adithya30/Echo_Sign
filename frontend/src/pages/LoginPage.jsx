import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function LoginPage() {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(credentials.username, credentials.password);
            toast.success(`Welcome back, ${user.username}!`);
            
            // Redirect to respective dashboard
            if (user.role === 'ADMIN') {
                navigate('/dashboard/admin');
            } else if (user.role === 'EMERGENCY_STAFF') {
                navigate('/dashboard/staff');
            } else {
                navigate('/dashboard/user');
            }
        } catch (err) {
            toast.error('Invalid username or password');
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
                    <img src="/assets/auth_bg.png" alt="EchoSign AI" className="auth-hero-image" />
                    <div className="auth-hero-overlay"></div>
                    <div className="auth-hero-content">
                        <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>🤟</span>
                        <h1>Breaking <span className="gradient-text">Barriers</span> with AI</h1>
                        <p>Experience the next generation of sign language translation and real-time communication.</p>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="auth-form-panel">
                    <div className="auth-form-header">
                        <h2>Welcome <span className="logo-accent">Back</span></h2>
                        <p>Please enter your credentials to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group-custom">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                className="input-custom"
                                value={credentials.username}
                                onChange={handleChange}
                                placeholder="Enter username"
                                required
                            />
                        </div>
                        <div className="form-group-custom">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                className="input-custom"
                                value={credentials.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button className="btn btn-cyan" type="submit" disabled={loading} style={{ marginTop: '1rem', minWidth: '200px' }}>
                                {loading ? 'Authenticating...' : 'Login to System'}
                            </button>
                        </div>
                    </form>

                    <div className="auth-footer">
                        New to EchoSign? <Link to="/signup">Create an account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
