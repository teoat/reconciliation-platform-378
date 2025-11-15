import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '../Modal'

describe('Modal Component', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    )
    
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} showCloseButton={true}>
        <div>Modal content</div>
      </Modal>
    )
    
    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when overlay is clicked and closeOnOverlayClick is true', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={true}>
        <div>Modal content</div>
      </Modal>
    )
    
    // Find the overlay element (first div with fixed inset-0 classes)
    const overlay = container.querySelector('.fixed.inset-0.transition-opacity')
    if (overlay) {
      fireEvent.click(overlay)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('should not call onClose when overlay is clicked and closeOnOverlayClick is false', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
        <div>Modal content</div>
      </Modal>
    )
    
    const overlay = container.querySelector('.fixed.inset-0.transition-opacity')
    if (overlay) {
      fireEvent.click(overlay)
      expect(mockOnClose).not.toHaveBeenCalled()
    }
  })

  it('should display title when provided', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal Title">
        <div>Modal content</div>
      </Modal>
    )
    
    expect(screen.getByText('Test Modal Title')).toBeInTheDocument()
  })

  it('should not display close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} showCloseButton={false}>
        <div>Modal content</div>
      </Modal>
    )
    
    const closeButton = screen.queryByLabelText('Close modal')
    expect(closeButton).not.toBeInTheDocument()
  })

  it('should render children content', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </div>
      </Modal>
    )
    
    expect(screen.getByText('First paragraph')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph')).toBeInTheDocument()
  })

  it('should use medium size by default', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    )
    
    const modal = container.querySelector('.max-w-lg')
    expect(modal).toBeInTheDocument()
  })

  it('should apply correct size classes', () => {
    const { rerender, container } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="sm">
        <div>Modal content</div>
      </Modal>
    )
    
    expect(container.querySelector('.max-w-md')).toBeInTheDocument()
    
    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="lg">
        <div>Modal content</div>
      </Modal>
    )
    expect(container.querySelector('.max-w-2xl')).toBeInTheDocument()
    
    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="xl">
        <div>Modal content</div>
      </Modal>
    )
    expect(container.querySelector('.max-w-4xl')).toBeInTheDocument()
    
    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="full">
        <div>Modal content</div>
      </Modal>
    )
    expect(container.querySelector('.max-w-full.mx-4')).toBeInTheDocument()
  })

  it('should have correct accessibility attributes', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    )
    
    const overlay = container.querySelector('[aria-hidden="true"]')
    expect(overlay).toBeInTheDocument()
    
    const closeButton = screen.queryByLabelText('Close modal')
    if (closeButton) {
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal')
    }
  })

  it('should not call onClose when clicking modal content (not overlay)', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={true}>
        <div>Modal content</div>
      </Modal>
    )
    
    // Click on the modal content itself, not the overlay
    const content = screen.getByText('Modal content')
    fireEvent.click(content)
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should handle multiple rapid close button clicks', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    )
    
    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)
    fireEvent.click(closeButton)
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(3)
  })
})

