import { useState, useRef, useCallback } from 'react';

interface Card3DViewerProps {
  imageSrc: string;
  cardName: string;
}

export function Card3DViewer({ imageSrc, cardName }: Card3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Relative position from 0 to 1
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Smooth rotation angle max 20 degrees
    const rotateX = ((y - centerY) / centerY) * -20;
    const rotateY = ((x - centerX) / centerX) * 20;
    
    setRotation({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.75,
    });
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smooth reset
    setRotation({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[421px]">
      {/* Static White Background Display Case */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-[533px] bg-bg-card border border-white/10 rounded-2xl p-6 flex items-center justify-center shadow-2xl cursor-grab active:cursor-grabbing overflow-hidden"
        style={{ perspective: '1000px' }}
      >
        {/* Floating 3D Card Item (Only this card tilts) */}
        <div
          className="relative w-[280px] sm:w-[310px] h-[430px] sm:h-[470px] flex items-center justify-center transition-transform ease-out will-change-transform"
          style={{
            transform: isHovered
              ? `rotateX(${rotation.x.toFixed(2)}deg) rotateY(${rotation.y.toFixed(2)}deg) scale3d(1.05, 1.05, 1.05)`
              : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            transitionDuration: isHovered ? '100ms' : '600ms',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Graded PSA Slab Card Image */}
          <img
            src={imageSrc}
            alt={cardName}
            draggable={false}
            className="w-full h-full object-contain filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.35)] pointer-events-none"
          />

          {/* Dynamic Holographic Foil & Glare Overlay (Attached directly to card) */}
          <div
            className="absolute inset-0 rounded-[12px] pointer-events-none transition-opacity duration-300 mix-blend-color-dodge"
            style={{
              opacity: glare.opacity,
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.9) 0%, rgba(180,225,255,0.45) 30%, rgba(255,190,240,0.25) 60%, transparent 80%)`,
            }}
          />

          {/* Diagonal Light Sheen */}
          <div
            className="absolute inset-0 rounded-[12px] pointer-events-none transition-opacity duration-300 mix-blend-overlay"
            style={{
              opacity: isHovered ? 0.45 : 0,
              background: `linear-gradient(${120 + rotation.y * 2.5}deg, transparent 20%, rgba(255,255,255,0.7) 50%, transparent 80%)`,
            }}
          />
        </div>
      </div>

      {/* 3D Interaction Hint Badge */}
      <div className="flex items-center gap-2 mt-4 text-xs text-[#8FB3E2] bg-bg-input/80 border border-white/15 rounded-full px-4 py-1.5 backdrop-blur-sm shadow-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-brand-blue animate-ping" />
        <span>Hover or drag over the card to inspect in 3D</span>
      </div>
    </div>
  );
}
