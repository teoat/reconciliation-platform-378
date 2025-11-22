// Button feedback wrapper for immediate visual feedback
import React from 'react';

interface ButtonFeedbackProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  [key: string]: unknown;
}

/**
 * Wrapper component that adds immediate visual feedback to any button
 * Provides sub-100ms visual response for better perceived performance
 */
export const ButtonFeedback: React.FC<ButtonFeedbackProps> = ({
  children,
  className = '',
  onClick,
  disabled = false,
  ...props
}) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'scale(0.95)';
    }
  };

<<<<<<< HEAD
  const handleMouseUp = (e: React.MouseEvent) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.currentTarget.style.transform = 'scale(1)';
  };
=======
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)'
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)'
  }
>>>>>>> 26355dbeb6c502c5e28667489dcec2dc481751c1

  return (
    <button
      {...props}
      className={`transition-transform duration-75 ${className}`}
      onClick={onClick}
      disabled={disabled}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
};

<<<<<<< HEAD
export { ButtonFeedback };
export default ButtonFeedback;
=======
export default ButtonFeedback

>>>>>>> 26355dbeb6c502c5e28667489dcec2dc481751c1
