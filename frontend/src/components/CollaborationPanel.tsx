// Temporary simple version to fix TypeScript errors
import React from 'react';

interface CollaborationPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  isOpen,
  onToggle,
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed right-4 top-20 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${className}`}
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold">Collaboration Panel</h3>
        <p className="text-sm text-gray-600">Coming soon...</p>
        <button
          onClick={onToggle}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CollaborationPanel;
