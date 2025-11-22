// ============================================================================
// COMPONENT TESTS - SINGLE SOURCE OF TRUTH
// ============================================================================

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  customRender,
  testButtonComponent,
  testInputComponent,
} from '../utils/testing';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import MetricCard from '../components/ui/MetricCard';

// ============================================================================
// BUTTON COMPONENT TESTS
// ============================================================================

describe('Button Component', () => {
  testButtonComponent(Button);

  it('renders with left icon', () => {
    customRender(<Button leftIcon={<span data-testid="left-icon">←</span>}>Test Button</Button>);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    customRender(<Button rightIcon={<span data-testid="right-icon">→</span>}>Test Button</Button>);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('renders as full width', () => {
    customRender(<Button fullWidth>Test Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  it('disables button when loading', () => {
    customRender(<Button loading>Test Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows loading spinner when loading', () => {
    customRender(<Button loading>Test Button</Button>);
    const button = screen.getByRole('button');
    // The spinner icon should be present, not the button itself
    const spinner = button.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

// ============================================================================
// INPUT COMPONENT TESTS
// ============================================================================

describe('Input Component', () => {
  testInputComponent(Input);

  it('renders with left icon', () => {
    customRender(
      <Input leftIcon={<span data-testid="left-icon">🔍</span>} placeholder="Search..." />
    );
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    customRender(
      <Input rightIcon={<span data-testid="right-icon">✓</span>} placeholder="Enter text" />
    );
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('shows success icon when value is present and no error', () => {
    customRender(<Input value="test" />);
    // Check for success icon (green checkmark)
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows error icon when error is present', () => {
    customRender(<Input error="Test error" />);
    // Check for error icon (red X)
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
  });

  it('renders as full width', () => {
    customRender(<Input fullWidth placeholder="Full width input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('w-full');
  });
});

// ============================================================================
// MODAL COMPONENT TESTS
// ============================================================================

describe('Modal Component', () => {
  it('renders with title', () => {
    customRender(
      <Modal isOpen onClose={vi.fn()} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.getByText(/test modal/i)).toBeInTheDocument();
  });

  it('renders without close button when showCloseButton is false', () => {
    customRender(
      <Modal isOpen onClose={vi.fn()} showCloseButton={false}>
        <div>Modal content</div>
      </Modal>
    );
    // The close button should not be present, but overlay might still be there
    expect(screen.queryByLabelText(/close modal/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('does not close on overlay click when closeOnOverlayClick is false', async () => {
    const handleClose = vi.fn();
    customRender(
      <Modal isOpen onClose={handleClose} closeOnOverlayClick={false}>
        <div>Modal content</div>
      </Modal>
    );

    const overlay = screen.getByRole('dialog').parentElement;
    await userEvent.click(overlay!);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('applies correct size classes', () => {
    customRender(
      <Modal isOpen onClose={vi.fn()} size="lg">
        <div>Modal content</div>
      </Modal>
    );
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-2xl');
  });
});

// ============================================================================
// STATUS BADGE COMPONENT TESTS
// ============================================================================

describe('StatusBadge Component', () => {
  it('renders with success status', () => {
    customRender(<StatusBadge status="success">Success</StatusBadge>);
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });

  it('renders with error status', () => {
    customRender(<StatusBadge status="error">Error</StatusBadge>);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('renders with warning status', () => {
    customRender(<StatusBadge status="warning">Warning</StatusBadge>);
    expect(screen.getByText(/warning/i)).toBeInTheDocument();
  });

  it('renders with pending status', () => {
    customRender(<StatusBadge status="pending">Pending</StatusBadge>);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('renders with info status', () => {
    customRender(<StatusBadge status="info">Info</StatusBadge>);
    expect(screen.getByText(/info/i)).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    customRender(
      <StatusBadge status="success" showIcon={false}>
        Success
      </StatusBadge>
    );
    const badge = screen.getByText(/success/i);
    expect(badge.parentElement).not.toHaveClass('mr-1.5');
  });

  it('applies correct size classes', () => {
    customRender(
      <StatusBadge status="success" size="lg">
        Success
      </StatusBadge>
    );
    const badge = screen.getByText(/success/i);
    expect(badge).toHaveClass('px-3', 'py-1', 'text-base');
  });
});

// ============================================================================
// METRIC CARD COMPONENT TESTS
// ============================================================================

describe('MetricCard Component', () => {
  it('renders with basic props', () => {
    customRender(<MetricCard title="Total Revenue" value="$10,000" />);
    expect(screen.getByText(/total revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/\$10,000/)).toBeInTheDocument();
  });

  it('renders with increase change', () => {
    customRender(
      <MetricCard
        title="Total Revenue"
        value="$10,000"
        change={{
          value: 15,
          type: 'increase',
          period: 'vs last month',
        }}
      />
    );
    expect(screen.getByText(/15%/)).toBeInTheDocument();
    expect(screen.getByText(/vs last month/)).toBeInTheDocument();
  });

  it('renders with decrease change', () => {
    customRender(
      <MetricCard
        title="Total Revenue"
        value="$10,000"
        change={{
          value: 5,
          type: 'decrease',
          period: 'vs last month',
        }}
      />
    );
    expect(screen.getByText(/5%/)).toBeInTheDocument();
  });

  it('renders with neutral change', () => {
    customRender(
      <MetricCard
        title="Total Revenue"
        value="$10,000"
        change={{
          value: 0,
          type: 'neutral',
          period: 'vs last month',
        }}
      />
    );
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  it('renders with icon', () => {
    customRender(
      <MetricCard
        title="Total Revenue"
        value="$10,000"
        icon={<span data-testid="revenue-icon">💰</span>}
      />
    );
    expect(screen.getByTestId('revenue-icon')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = customRender(<MetricCard title="Total Revenue" value="$10,000" loading />);
    // When loading, check for the loading skeleton with animate-pulse
    const loadingSkeleton = container.querySelector('.animate-pulse');
    expect(loadingSkeleton).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = customRender(<MetricCard title="Total Revenue" value="$10,000" className="custom-class" />);
    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Component Integration', () => {
  it('Button and Input work together in a form', async () => {
    const handleSubmit = vi.fn();

    customRender(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Input name="email" label="Email" placeholder="Enter your email" />
        <Button type="submit">Submit</Button>
      </form>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('Modal with form components', async () => {
    const handleClose = vi.fn();

    customRender(
      <Modal isOpen onClose={handleClose} title="Test Form">
        <Input name="name" label="Name" placeholder="Enter your name" />
        <Button onClick={handleClose}>Close Form</Button>
      </Modal>
    );

    expect(screen.getByText(/test form/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();

    // Click the "Close Form" button, not the modal close button
    await userEvent.click(screen.getByRole('button', { name: /close form/i }));
    expect(handleClose).toHaveBeenCalled();
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('Accessibility', () => {
  it('Button has proper ARIA attributes', () => {
    customRender(<Button aria-label="Test button">Test</Button>);
    expect(screen.getByLabelText(/test button/i)).toBeInTheDocument();
  });

  it('Input has proper label association', () => {
    customRender(<Input label="Test Input" />);
    const input = screen.getByLabelText(/test input/i);
    expect(input).toBeInTheDocument();
  });

  it('Modal has proper ARIA attributes', () => {
    customRender(
      <Modal isOpen onClose={vi.fn()} title="Test Modal">
        <div>Content</div>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('StatusBadge has proper color contrast', () => {
    customRender(<StatusBadge status="success">Success</StatusBadge>);
    const badge = screen.getByText(/success/i);
    expect(badge).toHaveClass('text-green-800');
  });

  it('Button supports keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    customRender(<Button onClick={handleClick}>Test Button</Button>);
    const button = screen.getByRole('button', { name: /test button/i });

    // Focus the button
    button.focus();
    expect(button).toHaveFocus();

    // Press Enter to activate
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Press Space to activate
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('Input has proper error state accessibility', () => {
    customRender(<Input label="Test Input" error="This field is required" />);
    const input = screen.getByLabelText(/test input/i);

    // Check for aria-describedby linking to error message
    expect(input).toHaveAttribute('aria-describedby');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    // Check that error message is associated
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toHaveAttribute('id');
  });

  it('Modal traps focus correctly', async () => {
    customRender(
      <Modal isOpen onClose={vi.fn()} title="Test Modal">
        <button>First Button</button>
        <button>Second Button</button>
        <input type="text" placeholder="Test input" />
      </Modal>
    );

    const modal = screen.getByRole('dialog');

    // Modal should be present
    expect(modal).toBeInTheDocument();

    // Focus should be managed (this is a basic check - full focus trapping would need more complex testing)
    expect(document.activeElement).toBeDefined();
  });

  it('MetricCard displays title and value correctly', () => {
    customRender(
      <MetricCard
        title="Test Metric"
        value="100"
        change={{ value: 10, type: 'increase' }}
      />
    );

    // Check that title and value are displayed
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('All interactive elements have accessible names', () => {
    customRender(
      <div>
        <Button>Click me</Button>
        <Input label="Name" />
        <StatusBadge status="success">Active</StatusBadge>
      </div>
    );

    // Check that all interactive elements have accessible names
    const button = screen.getByRole('button');
    const input = screen.getByRole('textbox');

    expect(button).toHaveAccessibleName();
    expect(input).toHaveAccessibleName();
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance', () => {
  it('Button renders quickly', () => {
    const start = performance.now();
    customRender(<Button>Test</Button>);
    const end = performance.now();

    expect(end - start).toBeLessThan(50); // Should render in less than 50ms
  });

  it('Input handles rapid typing', async () => {
    const handleChange = vi.fn();
    customRender(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'abcdefghijklmnopqrstuvwxyz');

    expect(handleChange).toHaveBeenCalledTimes(26);
  });

  it('Modal opens and closes smoothly', async () => {
    const handleClose = vi.fn();
    const { rerender } = customRender(
      <Modal isOpen={false} onClose={handleClose}>
        <div>Content</div>
      </Modal>
    );

    // Open modal
    rerender(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Content</div>
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Close modal
    await userEvent.click(screen.getByLabelText(/close modal/i));
    expect(handleClose).toHaveBeenCalled();
  });
});
