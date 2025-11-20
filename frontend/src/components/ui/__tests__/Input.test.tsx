import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Input } from '../Input';

describe('Input', () => {
  it('should render with default props', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should render with custom type', () => {
    render(<Input type="email" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should render with placeholder', () => {
    render(<Input placeholder="Enter your name" />);
    
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeInTheDocument();
  });

  it('should render with value', () => {
    render(<Input value="John Doe" />);
    
    const input = screen.getByDisplayValue('John Doe');
    expect(input).toBeInTheDocument();
  });

  it('should handle onChange events', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should show error state', () => {
    render(<Input error="This field is required" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should show success state', () => {
    render(<Input success />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input-success');
  });

  it('should render with label', () => {
    render(<Input label="Full Name" id="fullname" />);
    
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'fullname');
  });

  it('should render with helper text', () => {
    render(<Input helperText="Enter your full name" />);
    
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('should render with left icon', () => {
    const TestIcon = () => <span data-testid="left-icon">🔍</span>;
    render(<Input leftIcon={<TestIcon />} />);
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('should render with right icon', () => {
    const TestIcon = () => <span data-testid="right-icon">✕</span>;
    render(<Input rightIcon={<TestIcon />} />);
    
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('should support fullWidth prop', () => {
    render(<Input fullWidth />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('w-full');
  });

  it('should support size variants', () => {
    const { rerender } = render(<Input size="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('input-sm');

    rerender(<Input size="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('input-lg');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <Input 
        label="Email" 
        id="email" 
        error="Invalid email" 
        required 
        aria-describedby="email-help"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-help email-error');
    expect(input).toHaveAttribute('required');
  });

  it('should support custom className', () => {
    render(<Input className="custom-input" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('should handle focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should support maxLength', () => {
    render(<Input maxLength={10} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('should support pattern validation', () => {
    render(<Input pattern="[A-Za-z]+" title="Only letters allowed" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
    expect(input).toHaveAttribute('title', 'Only letters allowed');
  });
});
