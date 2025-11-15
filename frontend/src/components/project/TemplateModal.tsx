'use client';

import React from 'react';
import { X, Clock, Layers } from 'lucide-react';
import { ProjectTemplate } from '../../types/project';

interface TemplateModalProps {
  templates: ProjectTemplate[];
  onSelect: (template: ProjectTemplate) => void;
  onClose: () => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ templates, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">Choose Project Template</h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onSelect(template)}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-3 rounded-lg bg-${template.color}-100`}>
                    <span className="text-2xl">{template.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{template.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full bg-${template.color}-100 text-${template.color}-800`}
                    >
                      {template.complexity}
                    </span>
                  </div>
                </div>

                <p className="text-secondary-600 text-sm mb-4">{template.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-secondary-400" />
                    <span className="text-secondary-600">{template.estimatedDuration}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-secondary-400" />
                    <span className="text-secondary-600">{template.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
