// Matching Rules Component
import React, { useState } from 'react';
import { Settings, Plus, Trash2, Play } from 'lucide-react';
import type { MatchingRule, MatchingCriteria } from '../../types/reconciliation';

interface MatchingRulesProps {
  rules: MatchingRule[];
  onRulesChange: (rules: MatchingRule[]) => void;
  onTest?: (rule: MatchingRule) => void;
  className?: string;
}

export const MatchingRules: React.FC<MatchingRulesProps> = ({
  rules,
  onRulesChange,
  onTest,
  className = '',
}) => {
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const addRule = () => {
    const newRule: MatchingRule = {
      id: `rule-${Date.now()}`,
      name: 'New Rule',
      type: 'exact',
      criteria: [],
      weight: 1.0,
      applied: true,
      result: {
        matched: false,
        confidence: 0,
        reason: '',
        details: {},
      },
      confidence: 0,
    };
    onRulesChange([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<MatchingRule>) => {
    onRulesChange(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeRule = (id: string) => {
    onRulesChange(rules.filter((r) => r.id !== id));
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Matching Rules
        </h3>
        <button
          onClick={addRule}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      <div className="space-y-3">
        {rules.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No rules defined</p>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <label htmlFor={`rule-name-${rule.id}`} className="sr-only">
                    Rule name
                  </label>
                  <input
                    id={`rule-name-${rule.id}`}
                    type="text"
                    value={rule.name}
                    onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                    className="font-medium border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                    placeholder="Rule name"
                  />
                  <label htmlFor={`rule-type-${rule.id}`} className="sr-only">
                    Rule type
                  </label>
                  <select
                    id={`rule-type-${rule.id}`}
                    value={rule.type}
                    onChange={(e) =>
                      updateRule(rule.id, { type: e.target.value as MatchingRule['type'] })
                    }
                    className="text-sm border rounded px-2 py-1"
                    aria-label="Rule type"
                  >
                    <option value="exact">Exact</option>
                    <option value="fuzzy">Fuzzy</option>
                    <option value="algorithmic">Algorithmic</option>
                    <option value="manual">Manual</option>
                  </select>
                  <span className="text-sm text-gray-500">Weight: {rule.weight}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={rule.applied}
                      onChange={(e) => updateRule(rule.id, { applied: e.target.checked })}
                    />
                    Applied
                  </label>
                  {onTest && (
                    <button
                      onClick={() => onTest(rule)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Test rule"
                    >
                      <Play className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="p-1 hover:bg-red-100 rounded"
                    title="Remove rule"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
              {rule.criteria.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {rule.criteria.length} criteria defined
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

