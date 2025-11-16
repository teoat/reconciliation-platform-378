import React, { useState } from 'react';
import { Settings, Plus, Trash2, Edit } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { MatchingRule, MatchingCriteria } from '../../types/reconciliation';

interface MatchingRulesProps {
  rules: MatchingRule[];
  onRulesChange: (rules: MatchingRule[]) => void;
  isLoading?: boolean;
}

export const MatchingRules: React.FC<MatchingRulesProps> = ({
  rules,
  onRulesChange,
  isLoading = false,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<MatchingRule | null>(null);

  const handleAddRule = () => {
    const newRule: MatchingRule = {
      id: `rule_${Date.now()}`,
      name: `Matching Rule ${rules.length + 1}`,
      type: 'exact',
      criteria: [],
      weight: 1,
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

  const handleRemoveRule = (ruleId: string) => {
    onRulesChange(rules.filter((rule) => rule.id !== ruleId));
  };

  const handleToggleRule = (ruleId: string) => {
    onRulesChange(
      rules.map((rule) => (rule.id === ruleId ? { ...rule, applied: !rule.applied } : rule))
    );
  };

  const getRuleTypeLabel = (type: MatchingRule['type']) => {
    switch (type) {
      case 'exact':
        return 'Exact Match';
      case 'fuzzy':
        return 'Fuzzy Match';
      case 'algorithmic':
        return 'Algorithmic';
      case 'manual':
        return 'Manual Review';
      default:
        return type;
    }
  };

  const getRuleTypeColor = (type: MatchingRule['type']) => {
    switch (type) {
      case 'exact':
        return 'bg-blue-100 text-blue-800';
      case 'fuzzy':
        return 'bg-green-100 text-green-800';
      case 'algorithmic':
        return 'bg-purple-100 text-purple-800';
      case 'manual':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Matching Rules</h3>
          </div>
          <Button variant="primary" onClick={handleAddRule}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>

        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No matching rules defined</p>
              <Button variant="outline" onClick={handleAddRule}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Rule
              </Button>
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-lg p-4 ${
                  rule.applied ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={rule.applied}
                        onChange={() => handleToggleRule(rule.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Active</span>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900">{rule.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getRuleTypeColor(rule.type)}`}
                        >
                          {getRuleTypeLabel(rule.type)}
                        </span>
                        <span className="text-sm text-gray-600">Weight: {rule.weight}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleRemoveRule(rule.id)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Rule Criteria Preview */}
                {rule.criteria.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Criteria:</p>
                    <div className="flex flex-wrap gap-2">
                      {rule.criteria.map((criterion, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded"
                        >
                          {criterion.field} {criterion.operator} {String(criterion.value)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};
