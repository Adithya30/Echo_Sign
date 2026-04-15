import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchProfile();
        } else {
            setUser(null);
            setLoading(false);
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/auth/profile/');
            setUser(res.data);
        } catch (err) {
            console.error('Failed to fetch profile', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        const res = await axios.post('http://127.0.0.1:8000/api/auth/login/', { username, password });
        const { access } = res.data;
        localStorage.setItem('token', access);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        
        // Fetch profile immediately to get the role
        const profileRes = await axios.get('http://127.0.0.1:8000/api/auth/profile/');
        setUser(profileRes.data);
        setToken(access);
        
        return profileRes.data;
    };

    const signup = async (userData) => {
        await axios.post('http://127.0.0.1:8000/api/auth/signup/', userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const isAdmin = user?.role === 'ADMIN';
    const isStaff = user?.role === 'EMERGENCY_STAFF' || isAdmin;

    const value = {
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAdmin,
        isStaff
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
