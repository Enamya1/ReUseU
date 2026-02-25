import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type FloatingButtonProps = {
  to: string;
  label: string;
  scrollTargetId?: string;
  containerClassName?: string;
  buttonClassName?: string;
  centerIcon?: React.ReactNode;
  id?: string;
  onClick?: () => void;
};

const FloatingButton: React.FC<FloatingButtonProps> = ({
  to,
  label,
  scrollTargetId,
  containerClassName,
  buttonClassName,
  centerIcon,
  id,
  onClick,
}) => {
  const buttonRef = useRef<HTMLAnchorElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const containerElement = containerRef.current;
    if (!button || !containerElement) {
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frameId = 0;

    const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
      Math.hypot(p2.x - p1.x, p2.y - p1.y);

    const handleMove = (event: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const mouse = { x: event.clientX, y: event.clientY };
      const distance = getDistance(mouse, center);
      const radius = 180;

      if (distance < radius) {
        button.classList.add('magnetic-active');
        const force = Math.max(0, (radius - distance) / radius);
        targetX = (mouse.x - center.x) * force * 0.4;
        targetY = (mouse.y - center.y) * force * 0.4;
      } else {
        button.classList.remove('magnetic-active');
        targetX = 0;
        targetY = 0;
      }
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      containerElement.style.transform = `translate(${currentX}px, ${currentY}px)`;
      frameId = window.requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMove);
    animate();

    const handleClick = () => {
      button.style.transform = 'scale(0.95)';
      window.setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);
      if (scrollTargetId) {
        const target = document.getElementById(scrollTargetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
      if (onClick) {
        onClick();
      }
    };

    button.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      button.removeEventListener('click', handleClick);
      window.cancelAnimationFrame(frameId);
    };
  }, [onClick, scrollTargetId]);

  return (
    <div ref={containerRef} className={cn('contact-button-container hidden lg:block', containerClassName)}>
      <Link
        to={to}
        ref={buttonRef}
        id={id}
        className={cn('landing-cursor-hover landing-contact-button contact-button relative block h-28 w-28', buttonClassName)}
      >
        <div className="circular-text">
          <svg viewBox="0 0 120 120">
            <defs>
              <path id="landing-circle" d="M60,60 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0" />
            </defs>
            <text>
              <textPath href="#landing-circle" startOffset="0%">
                {label}
              </textPath>
            </text>
          </svg>
        </div>
        <div className="button-center">
          {centerIcon || <ArrowRight className="h-5 w-5" />}
        </div>
      </Link>
    </div>
  );
};

export default FloatingButton;
