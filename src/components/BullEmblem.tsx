import React from 'react';

interface BullEmblemProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const BullEmblem: React.FC<BullEmblemProps> = ({
  className = '',
  size = 48,
  glow = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-xl bg-[#C9A227]/25 blur-lg pointer-events-none"
          aria-hidden="true"
        />
      )}
      <div
        className="relative z-10 w-full h-full rounded-xl overflow-hidden border border-[#C9A227]/40 bg-[#050505] shadow-md shadow-black/80 flex items-center justify-center group"
      >
        <img
          src="/cow-logo.jpg"
          alt="Emblema Ganadero Vaca Dorada"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain p-0.5 filter contrast-110 brightness-105 transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    </div>
  );
};
