
import { useState, useEffect } from 'react';

export const useKeyboardDetection = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleFocusIn = () => {
      // Add a small delay to ensure the keyboard is fully shown
      setTimeout(() => setIsKeyboardVisible(true), 150);
    };

    const handleFocusOut = () => {
      // Add a small delay to ensure the keyboard is fully hidden
      setTimeout(() => setIsKeyboardVisible(false), 150);
    };

    // Listen for focus events on input elements
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return isKeyboardVisible;
};
