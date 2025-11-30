import React from 'react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isAuthenticated: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange, isAuthenticated }) => {
  if (!isAuthenticated) return null;

  const navItems = [
    { id: 'projects', label: 'Projects' },
    { id: 'ingestion', label: 'Data Ingestion' },
    { id: 'reconciliation', label: 'Reconciliation' },
    { id: 'visualization', label: 'Visualization' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Reconciliation Platform</h1>
        <div className="flex space-x-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`px-3 py-2 rounded ${
                currentPage === item.id ? 'bg-blue-800' : 'hover:bg-blue-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
