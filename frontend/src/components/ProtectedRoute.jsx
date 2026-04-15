import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roleRequired }) {
    const { user, token, loading, isStaff, isAdmin } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '80vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roleRequired === 'ADMIN' && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (roleRequired === 'STAFF' && !isStaff) {
        return <Navigate to="/" replace />;
    }

    return children;
}
