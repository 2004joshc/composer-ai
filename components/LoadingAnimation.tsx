'use client';

import { useEffect, useState } from 'react';

const MESSAGES = [
  'Analyzing your parameters…',
  'Choosing key and scale…',
  'Building chord progression…',
  'Composing melody…',
  'Adding bass line…',
  'Arranging voices…',
  'Finalizing MIDI…',
];

export default function LoadingAnimation() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card p-8 flex flex-col items-center gap-5 animate-fade-in">
      {/* Animated staff bars */}
      <div className="flex items-end gap-1.5 h-10 text-warm-500">
        {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
          <span
            key={i}
            className="wave-bar"
            style={{
              height: '100%',
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>

      {/* Status text */}
      <p
        key={msgIndex}
        className="text-sm text-ink/60 animate-fade-in"
      >
        {MESSAGES[msgIndex]}
      </p>

      {/* Subtle progress dots */}
      <div className="flex gap-1.5">
        {MESSAGES.map((_, i) => (
          <span
            key={i}
            className={`
              w-1.5 h-1.5 rounded-full transition-all duration-300
              ${i <= msgIndex ? 'bg-warm-500' : 'bg-warm-200'}
            `}
          />
        ))}
      </div>
    </div>
  );
}
