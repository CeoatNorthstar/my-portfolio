import { useRef, useEffect } from 'react';
import ParticleAccelerator from '../../lib/particleAccelerator';

const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new ParticleAccelerator(canvas);
    engineRef.current = engine;
    engine.init();
    engine.start();

    const handleResize = () => {
      engine.resize();
      engine._createStars();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, []);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    engineRef.current?.onMouseMove(e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => engineRef.current?.onMouseEnter()}
      onMouseLeave={() => engineRef.current?.onMouseLeave()}
    />
  );
};

export default ParticleCanvas;
