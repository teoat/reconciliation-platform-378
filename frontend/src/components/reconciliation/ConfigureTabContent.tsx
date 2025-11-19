import React from 'react';
import Card from '@/components/ui/Card';

interface ReconciliationSettings {
  matchingThreshold: number;
  autoApprove: boolean;
  notificationEmail: string;
  dataSourceMapping: {};
}

interface ConfigureTabContentProps {
  reconciliationSettings: ReconciliationSettings;
  setReconciliationSettings: React.Dispatch<React.SetStateAction<ReconciliationSettings>>;
}

export const ConfigureTabContent: React.FC<ConfigureTabContentProps> = ({
  reconciliationSettings,
  setReconciliationSettings,
}) => {
  return (
    <div
      id="tabpanel-configure"
      role="tabpanel"
      aria-labelledby="tab-configure"
      className="space-y-6"
    >
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Reconciliation Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="matching-threshold"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Matching Threshold
              </label>
              <input
                id="matching-threshold"
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={reconciliationSettings.matchingThreshold}
                onChange={(e) =>
                  setReconciliationSettings((prev) => ({
                    ...prev,
                    matchingThreshold: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full"
                aria-label="Matching threshold slider"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>10%</span>
                <span className="font-medium">
                  {Math.round(reconciliationSettings.matchingThreshold * 100)}%
                </span>
                <span>100%</span>
              </div>
            </div>
            <div>
              <label
                htmlFor="auto-approve"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Auto-approve matches
              </label>
              <input
                id="auto-approve"
                type="checkbox"
                checked={reconciliationSettings.autoApprove}
                onChange={(e) =>
                  setReconciliationSettings((prev) => ({
                    ...prev,
                    autoApprove: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label="Auto-approve matches checkbox"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
