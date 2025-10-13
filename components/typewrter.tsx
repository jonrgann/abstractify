import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

// Typewriter component for reasoning text
interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number; // Animation delay in milliseconds
  className?: string;
}

// Typewriter component for reasoning text
export const TypewriterText = ({ text, speed = 5, delay = 0, className }: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!text) return;
    
    setDisplayedText('');
    setIsComplete(false);
    setHasStarted(false);

    // Start the animation after the specified delay
    const delayTimer = setTimeout(() => {
      setHasStarted(true);
      let index = 0;

      const typeTimer = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          setIsComplete(true);
          clearInterval(typeTimer);
        }
      }, speed);

      return () => clearInterval(typeTimer);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
    };
  }, [text, speed, delay]);

  return (
    <span className={cn(className)}>
      {displayedText}
      {hasStarted && !isComplete && <span className="animate-pulse"></span>}
    </span>
  );
};

