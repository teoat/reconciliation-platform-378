import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch, clearAuth } from '../store/unifiedStore';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
}

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) return null;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'projects', label: 'Projects', path: '/projects' },
    { id: 'ingestion', label: 'Data Ingestion', path: '/ingestion' },
    { id: 'reconciliation', label: 'Reconciliation', path: '/reconciliation' },
    { id: 'adjudication', label: 'Adjudication', path: '/adjudication' },
    { id: 'visualization', label: 'Visualization', path: '/visualization' },
    { id: 'summary', label: 'Summary', path: '/summary' },
  ];

  const handleLogout = () => {
    dispatch(clearAuth());
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="text-xl font-bold hover:text-indigo-200 transition-colors">
            378 Reconciliation Platform
          </Link>
          
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="text-sm text-indigo-100 hover:text-white transition-colors"
              title={user?.email || 'Profile'}
            >
              {user?.firstName || user?.email || 'Profile'}
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-700 rounded-md hover:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
