import React, { useRef, useEffect } from 'react';

interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  /** 0 = paint once (static grain). >0 = refresh every N frames. */
  patternRefreshInterval?: number;
  patternAlpha?: number;
}

const Noise: React.FC<NoiseProps> = ({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15
}) => {
  const grainRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let frame = 0;
    let animationId = 0;
    // 512 is enough for a soft full-bleed grain; 1024 was 4× the fill cost.
    const canvasSize = 512;

    const resize = () => {
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
    };

    const drawGrain = () => {
      const imageData = ctx.createImageData(canvasSize, canvasSize);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = patternAlpha;
      }

      ctx.putImageData(imageData, 0, 0);
    };

    resize();
    drawGrain();

    // Static grain — same look at rest, no per-frame ImageData churn.
    if (patternRefreshInterval <= 0) {
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }

    const loop = () => {
      if (frame % patternRefreshInterval === 0) drawGrain();
      frame++;
      animationId = window.requestAnimationFrame(loop);
    };

    window.addEventListener('resize', resize);
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationId);
    };
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha]);

  return (
    <canvas
      className="pointer-events-none absolute top-0 left-0 h-screen w-screen"
      ref={grainRef}
      style={{
        imageRendering: 'pixelated'
      }}
    />
  );
};

export default Noise;
