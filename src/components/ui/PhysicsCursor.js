import { useEffect, useRef } from 'react';

const PhysicsCursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const visible = useRef(false);

  useEffect(() => {
    // Don't show on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!visible.current) {
        visible.current = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }
    };

    const onLeave = () => {
      visible.current = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const onHoverStart = () => {
      ring.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px) scale(1.8)`;
      ring.style.borderColor = 'rgba(255,255,255,0.3)';
    };

    const onHoverEnd = () => {
      ring.style.borderColor = 'rgba(255,255,255,0.15)';
    };

    // Animate ring following cursor with lag
    let animId;
    const animate = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.15;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.15;

      dot.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      ring.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px)`;

      animId = requestAnimationFrame(animate);
    };

    // Listen for hoverable elements
    const addHoverListeners = () => {
      const elements = document.querySelectorAll('a, button, [role="button"], input, textarea');
      elements.forEach((el) => {
        el.addEventListener('mouseenter', onHoverStart);
        el.addEventListener('mouseleave', onHoverEnd);
      });
      return elements;
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    animate();

    // Observe DOM changes to attach hover listeners to new elements
    let hoveredElements = addHoverListeners();
    const observer = new MutationObserver(() => {
      hoveredElements.forEach((el) => {
        el.removeEventListener('mouseenter', onHoverStart);
        el.removeEventListener('mouseleave', onHoverEnd);
      });
      hoveredElements = addHoverListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(animId);
      observer.disconnect();
      hoveredElements.forEach((el) => {
        el.removeEventListener('mouseenter', onHoverStart);
        el.removeEventListener('mouseleave', onHoverEnd);
      });
    };
  }, []);

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1 h-1 bg-white rounded-full pointer-events-none z-[100] opacity-0"
        style={{
          marginLeft: '-2px',
          marginTop: '-2px',
          transition: 'opacity 0.3s',
        }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[100] opacity-0"
        style={{
          marginLeft: '-16px',
          marginTop: '-16px',
          border: '1px solid rgba(255,255,255,0.15)',
          transition: 'opacity 0.3s, border-color 0.3s, transform 0.15s ease-out',
        }}
      />
    </>
  );
};

export default PhysicsCursor;
