/**
 * Share Report Modal Component
 */

import { useState } from 'react';
import { X, Share2, Mail, Link as LinkIcon } from 'lucide-react';
import type { CustomReport } from '../types';
import { reportsApiService } from '@/services/reportsApiService';
import { logger } from '@/services/logger';
import { useToast } from '@/hooks/useToast';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

interface ShareReportModalProps {
  report: CustomReport;
  onClose: () => void;
}

export function ShareReportModal({ report, onClose }: ShareReportModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shareType, setShareType] = useState<'users' | 'link'>('users');
  const [userIds, setUserIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<'view' | 'edit'>('view');
  const [shareLink, setShareLink] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleShare = async () => {
    setIsLoading(true);
    try {
      if (shareType === 'users') {
        if (userIds.length === 0) {
          setErrors({ users: 'Please select at least one user' });
          setIsLoading(false);
          return;
        }

        const response = await reportsApiService.shareReport({
          reportId: report.id,
          userIds,
          permissions,
        });

        if (response.success && response.data) {
          setShareLink(response.data.shareLink);
          logger.info('Report shared successfully', { reportId: report.id });
          toast.success('Report shared successfully');
        } else {
          setErrors({ submit: 'Failed to share report' });
          toast.error('Failed to share report');
        }
      } else {
        // Generate share link
        const response = await reportsApiService.shareReport({
          reportId: report.id,
          userIds: [],
          permissions: 'view',
        });

        if (response.success && response.data) {
          setShareLink(response.data.shareLink);
          toast.success('Share link generated successfully');
        } else {
          setErrors({ submit: 'Failed to generate share link' });
          toast.error('Failed to generate share link');
        }
      }
    } catch (error) {
      logger.error('Error sharing report', { error });
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to share report' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Link copied to clipboard');
    } catch (error) {
      logger.error('Failed to copy to clipboard', { error });
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-secondary-900">Share Report</h3>
            <p className="text-sm text-secondary-600 mt-1">{report.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
            aria-label="Close share modal"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6">
          <Select
            label="Share Type"
            value={shareType}
            onChange={(e) => setShareType(e.target.value as 'users' | 'link')}
            options={[
              { value: 'users', label: 'Share with Users' },
              { value: 'link', label: 'Generate Share Link' },
            ]}
            fullWidth
            aria-label="Select share type"
          />

          {shareType === 'users' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User IDs (comma-separated)
                </label>
                <Input
                  placeholder="user-1, user-2, user-3"
                  onChange={(e) => {
                    const ids = e.target.value.split(',').map((id) => id.trim()).filter(Boolean);
                    setUserIds(ids);
                  }}
                  error={errors.users}
                  fullWidth
                />
              </div>
              <Select
                label="Permissions"
                value={permissions}
                onChange={(e) => setPermissions(e.target.value as 'view' | 'edit')}
                options={[
                  { value: 'view', label: 'View Only' },
                  { value: 'edit', label: 'View and Edit' },
                ]}
                fullWidth
                aria-label="Select permissions level"
              />
            </>
          )}

          {shareLink && (
            <div className="p-4 bg-primary-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Share Link</label>
              <div className="flex items-center space-x-2">
                <Input value={shareLink} readOnly fullWidth />
                <button
                  onClick={copyToClipboard}
                  className="btn-secondary flex items-center space-x-2"
                  title="Copy to clipboard"
                  aria-label="Copy share link to clipboard"
                >
                  <LinkIcon className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-6 border-t border-secondary-200">
            <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
              Cancel
            </button>
            <button onClick={handleShare} className="btn-primary flex items-center space-x-2" disabled={isLoading}>
              <Share2 className="w-4 h-4" />
              <span>{isLoading ? 'Sharing...' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

