/**
 * Create Report Modal Component - Form for creating new reports
 */

import { X, Save, Settings } from 'lucide-react';

interface CreateReportModalProps {
  onClose: () => void;
}

export function CreateReportModal({ onClose }: CreateReportModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-secondary-900">Create Custom Report</h3>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
            aria-label="Close create report modal"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center py-8">
            <Settings className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-secondary-900 mb-2">Report Builder</h4>
            <p className="text-secondary-600">
              Advanced report creation interface would be implemented here
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 mt-6 pt-6 border-t border-secondary-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Create Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}

