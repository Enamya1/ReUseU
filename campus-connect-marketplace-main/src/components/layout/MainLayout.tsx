import React, { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import FloatingButton from '@/components/LandingFloatingButton';

interface MainLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  showHeader?: boolean;
  showFloatingButton?: boolean;
  headerClassName?: string;
  floatingButtonClassName?: string;
  floatingButtonContainerClassName?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showFooter = true,
  showHeader = true,
  showFloatingButton = true,
  headerClassName,
  floatingButtonClassName,
  floatingButtonContainerClassName,
}) => {
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const cursorRingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (isCoarsePointer) {
      return;
    }

    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) {
      return;
    }

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    const followSpeed = 0.6;
    let frameId = 0;

    const setCursorVisible = (visible: boolean) => {
      const opacity = visible ? '1' : '0';
      dot.style.opacity = opacity;
      ring.style.opacity = opacity;
    };

    const handleMouseMove = (event: MouseEvent) => {
      const isInside =
        event.clientX >= 0 &&
        event.clientY >= 0 &&
        event.clientX <= window.innerWidth &&
        event.clientY <= window.innerHeight;
      setCursorVisible(isInside);
      if (!isInside) {
        return;
      }
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * followSpeed;
      ringY += (mouseY - ringY) * followSpeed;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      frameId = window.requestAnimationFrame(animateRing);
    };

    const hoverTargets = Array.from(
      document.querySelectorAll('a, button, .feature-card, .step, .about-feature, .landing-cursor-hover'),
    );
    const handleEnter = () => ring.classList.add('hover');
    const handleLeave = () => ring.classList.remove('hover');
    const handleMouseDown = () => ring.classList.add('click');
    const handleMouseUp = () => ring.classList.remove('click');
    const handleMouseLeaveWindow = () => setCursorVisible(false);
    const handleMouseEnterWindow = () => setCursorVisible(true);
    const handleWindowBlur = () => setCursorVisible(false);
    const handleMouseOutWindow = (event: MouseEvent) => {
      if (!event.relatedTarget) {
        setCursorVisible(false);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        setCursorVisible(false);
      }
    };

    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', handleEnter);
      el.addEventListener('mouseleave', handleLeave);
    });

    setCursorVisible(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeaveWindow);
    document.addEventListener('mouseenter', handleMouseEnterWindow);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('mouseout', handleMouseOutWindow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    frameId = window.requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
      document.removeEventListener('mouseenter', handleMouseEnterWindow);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('mouseout', handleMouseOutWindow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      hoverTargets.forEach((el) => {
        el.removeEventListener('mouseenter', handleEnter);
        el.removeEventListener('mouseleave', handleLeave);
      });
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="app-cursor-root min-h-screen flex flex-col">
      <div ref={cursorDotRef} className="cursor-dot" />
      <div ref={cursorRingRef} className="cursor-ring" />
      {showHeader && <Header className={headerClassName} />}
      <main className="flex-1">
        {children}
      </main>
      {showHeader && showFloatingButton && (
        <FloatingButton
          to="/create-listing"
          label="List your pre-loved item for sale today! •"
          centerIcon={<Plus className="h-5 w-5" />}
          buttonClassName={floatingButtonClassName}
          containerClassName={floatingButtonContainerClassName}
        />
      )}
      {showFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
