import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import { EnhancedContextualHelp } from '@/components/ui/EnhancedContextualHelp';

interface ReconciliationHeaderProps {
  projectName?: string;
  onSettingsClick: () => void;
  onUploadClick: () => void;
}

export const ReconciliationHeader: React.FC<ReconciliationHeaderProps> = ({
  projectName,
  onSettingsClick,
  onUploadClick,
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-b" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              ← Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-xl font-semibold text-gray-900" id="page-title">
                  {projectName ?? 'Unknown Project'}
                </h1>
                <p className="text-sm text-gray-500">Reconciliation Management</p>
              </div>
              <EnhancedContextualHelp
                feature="reconciliation"
                trigger="click"
                position="bottom"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onSettingsClick}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="primary" onClick={onUploadClick}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
