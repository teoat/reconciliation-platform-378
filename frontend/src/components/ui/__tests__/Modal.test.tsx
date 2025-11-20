import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Modal } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>,
  };

  it('should not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should render with custom size', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    expect(screen.getByRole('dialog')).toHaveClass('modal-sm');

    rerender(<Modal {...defaultProps} size="lg" />);
    expect(screen.getByRole('dialog')).toHaveClass('modal-lg');

    rerender(<Modal {...defaultProps} size="xl" />);
    expect(screen.getByRole('dialog')).toHaveClass('modal-xl');
  });

  it('should call onClose when close button is clicked', () => {
    render(<Modal {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    render(<Modal {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when other keys are pressed', () => {
    render(<Modal {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: 'Enter' });
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should call onClose when backdrop is clicked', () => {
    render(<Modal {...defaultProps} />);
    
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when modal content is clicked', () => {
    render(<Modal {...defaultProps} />);
    
    const modalContent = screen.getByRole('dialog');
    fireEvent.click(modalContent);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should render footer when provided', () => {
    const footer = <button>Save Changes</button>;
    render(<Modal {...defaultProps} footer={footer} />);
    
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    render(<Modal {...defaultProps} className="custom-modal" />);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('custom-modal');
  });

  it('should have proper accessibility attributes', () => {
    render(<Modal {...defaultProps} />);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(modal).toHaveAttribute('aria-describedby', 'modal-description');
    
    const title = screen.getByText('Test Modal');
    expect(title).toHaveAttribute('id', 'modal-title');
  });

  it('should focus first focusable element when opened', async () => {
    render(
      <Modal {...defaultProps}>
        <button data-testid="first-button">First Button</button>
        <button data-testid="second-button">Second Button</button>
      </Modal>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('first-button')).toHaveFocus();
    });
  });

  it('should restore focus to previously focused element when closed', async () => {
    const outsideButton = document.createElement('button');
    outsideButton.textContent = 'Outside Button';
    document.body.appendChild(outsideButton);
    outsideButton.focus();
    
    const { rerender } = render(<Modal {...defaultProps} isOpen={false} />);
    
    rerender(<Modal {...defaultProps} isOpen={true} />);
    
    rerender(<Modal {...defaultProps} isOpen={false} />);
    
    await waitFor(() => {
      expect(outsideButton).toHaveFocus();
    });
    
    document.body.removeChild(outsideButton);
  });

  it('should prevent body scroll when open', () => {
    const originalOverflow = document.body.style.overflow;
    
    const { unmount } = render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
    
    unmount();
    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it('should render loading state', () => {
    render(<Modal {...defaultProps} loading loadingText="Saving..." />);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should render with custom close button label', () => {
    render(<Modal {...defaultProps} closeButtonLabel="Dismiss" />);
    
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('should support controlled open/close state', () => {
    const { rerender } = render(<Modal {...defaultProps} isOpen={true} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    
    rerender(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });
});
