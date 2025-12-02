import React from 'react';
import Modal from './Modal';

interface LazyModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
}

export const LazyModal: React.FC<LazyModalProps> = (props) => {
  return <Modal {...props} />;
};

export default LazyModal;
