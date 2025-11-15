import React, { Suspense, lazy } from 'react';

// Lazy load the Modal component
const Modal = lazy(() => import('./Modal'));

interface LazyModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Loading fallback for modal
const ModalSkeleton = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black bg-opacity-50" />
    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="flex justify-end space-x-2">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Lazy-loaded Modal component
 * Only loads the Modal component when it's actually needed
 */
const LazyModal: React.FC<LazyModalProps> = (props) => {
  // Don't render anything if modal is not open
  if (!props.isOpen) {
    return null;
  }

  return (
    <Suspense fallback={<ModalSkeleton />}>
      <Modal {...props} />
    </Suspense>
  );
};

export default LazyModal;
