import { useState, useEffect } from 'react';

export const useFadeInAnimation = (delay: number = 100) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return [isVisible, setIsVisible] as const;
};
