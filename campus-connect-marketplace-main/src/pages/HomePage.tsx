import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import MainLayout from '@/components/layout/MainLayout';
import FloatingButton from '@/components/LandingFloatingButton';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const navLinks = [
    { href: '#about', label: t('landing.nav.about') },
    { href: '#features', label: t('landing.nav.features') },
    { href: '#how', label: t('landing.nav.how') },
    { href: '#contact', label: t('landing.nav.contact') },
  ];

  const stats = [
    { value: '50K+', label: t('landing.stats.activeUsers') },
    { value: '120K+', label: t('landing.stats.itemsTraded') },
    { value: '$2M+', label: t('landing.stats.savings') },
    { value: '50+', label: t('landing.stats.universities') },
  ];

  const aboutFeatures = [
    {
      icon: '🔒',
      title: t('landing.about.features.verified.title'),
      desc: t('landing.about.features.verified.desc'),
    },
    {
      icon: '📍',
      title: t('landing.about.features.campus.title'),
      desc: t('landing.about.features.campus.desc'),
    },
    {
      icon: '💬',
      title: t('landing.about.features.chat.title'),
      desc: t('landing.about.features.chat.desc'),
    },
    {
      icon: '⭐',
      title: t('landing.about.features.ratings.title'),
      desc: t('landing.about.features.ratings.desc'),
    },
  ];

  const featureItems = t('landing.features.items', { returnObjects: true }) as Array<{
    number: string;
    icon: string;
    title: string;
    desc: string;
  }>;

  const steps = t('landing.how.steps', { returnObjects: true }) as Array<{
    number: string;
    title: string;
    desc: string;
  }>;

  const primaryHref = isAuthenticated ? '/create-listing' : '/signup';
  const primaryLabel = isAuthenticated ? t('landing.primaryCtaAuthed') : t('landing.primaryCta');
  const secondaryHref = isAuthenticated ? '#features' : '#about';
  const secondaryLabel = isAuthenticated ? t('landing.secondaryCtaAuthed') : t('landing.secondaryCta');
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 25);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const particleCount = 2500;
    const particleSize = 0.12;

    const spherePositions = new Float32Array(particleCount * 3);
    const randomPositions = new Float32Array(particleCount * 3);
    const torusPositions = new Float32Array(particleCount * 3);
    const cubePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 6.0;
      spherePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      spherePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      spherePositions[i3 + 2] = radius * Math.cos(phi);
    }

    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      randomPositions[i3] = (Math.random() - 0.5) * 25;
      randomPositions[i3 + 1] = (Math.random() - 0.5) * 25;
      randomPositions[i3 + 2] = (Math.random() - 0.5) * 25;
    }

    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const majorRadius = 7.0;
      const tubeRadius = 2.5;
      torusPositions[i3] = (majorRadius + tubeRadius * Math.cos(v)) * Math.cos(u);
      torusPositions[i3 + 1] = (majorRadius + tubeRadius * Math.cos(v)) * Math.sin(u);
      torusPositions[i3 + 2] = tubeRadius * Math.sin(v);
    }

    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      const face = Math.floor(Math.random() * 6);
      const size = 8.0;
      const u = (Math.random() * 2 - 1) * size;
      const v = (Math.random() * 2 - 1) * size;
      let x = 0;
      let y = 0;
      let z = 0;
      switch (face) {
        case 0:
          x = size;
          y = u;
          z = v;
          break;
        case 1:
          x = -size;
          y = u;
          z = v;
          break;
        case 2:
          x = u;
          y = size;
          z = v;
          break;
        case 3:
          x = u;
          y = -size;
          z = v;
          break;
        case 4:
          x = u;
          y = v;
          z = size;
          break;
        case 5:
          x = u;
          y = v;
          z = -size;
          break;
        default:
          break;
      }
      cubePositions[i3] = x;
      cubePositions[i3 + 1] = y;
      cubePositions[i3 + 2] = z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(spherePositions.slice(), 3));

    const createCircleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }
      context.fillStyle = '#fff';
      context.beginPath();
      context.arc(16, 16, 14, 0, 2 * Math.PI);
      context.fill();
      return new THREE.CanvasTexture(canvas);
    };

    const circleTexture = createCircleTexture();

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: particleSize,
      map: circleTexture ?? undefined,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    const mouse = new THREE.Vector2(0, 0);
    const repelPoint = new THREE.Vector3(0, 0, 0);
    const repelRadius = 5;
    const repelStrength = 0.12;

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let currentShape = 0;
    let targetPositions = spherePositions;

    const updateShapeOnScroll = () => {
      const scrollProgress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      let newShape = 0;
      let newTarget = spherePositions;
      if (scrollProgress < 0.2) {
        newShape = 0;
        newTarget = spherePositions;
      } else if (scrollProgress < 0.4) {
        newShape = 1;
        newTarget = randomPositions;
      } else if (scrollProgress < 0.6) {
        newShape = 2;
        newTarget = torusPositions;
      } else {
        newShape = 3;
        newTarget = cubePositions;
      }

      if (newShape !== currentShape) {
        currentShape = newShape;
        targetPositions = newTarget;
      }
    };

    window.addEventListener('scroll', updateShapeOnScroll, { passive: true });

    let frameId = 0;
    let time = 0;
    const positions = geometry.attributes.position.array as Float32Array;

    const animate = () => {
      time += 0.008;
      const lerpFactor = 0.025;

      for (let i = 0; i < particleCount; i += 1) {
        const i3 = i * 3;
        const floatX = Math.sin(time + i * 0.1) * 0.03;
        const floatY = Math.cos(time + i * 0.08) * 0.03;
        const floatZ = Math.sin(time + i * 0.06) * 0.03;

        const targetX = targetPositions[i3] + floatX;
        const targetY = targetPositions[i3 + 1] + floatY;
        const targetZ = targetPositions[i3 + 2] + floatZ;

        positions[i3] += (targetX - positions[i3]) * lerpFactor;
        positions[i3 + 1] += (targetY - positions[i3 + 1]) * lerpFactor;
        positions[i3 + 2] += (targetZ - positions[i3 + 2]) * lerpFactor;
      }

      repelPoint.x = mouse.x * 15;
      repelPoint.y = mouse.y * 10;
      repelPoint.z = 0;

      for (let i = 0; i < particleCount; i += 1) {
        const i3 = i * 3;
        const dx = positions[i3] - repelPoint.x;
        const dy = positions[i3 + 1] - repelPoint.y;
        const dz = positions[i3 + 2] - repelPoint.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < repelRadius && dist > 0.001) {
          const force = (1 - dist / repelRadius) * repelStrength;
          positions[i3] += (dx / dist) * force;
          positions[i3 + 1] += (dy / dist) * force;
          positions[i3 + 2] += (dz / dist) * force;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      particleSystem.rotation.y += 0.0008;
      particleSystem.rotation.x += 0.0003;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateShapeOnScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.cancelAnimationFrame(frameId);
      geometry.dispose();
      material.dispose();
      if (circleTexture) {
        circleTexture.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('.reveal'));
    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
    if (anchorLinks.length === 0) {
      return;
    }

    const handleAnchorClick = (event: Event) => {
      const target = event.currentTarget as HTMLAnchorElement | null;
      if (!target) {
        return;
      }
      const href = target.getAttribute('href');
      if (!href) {
        return;
      }
      const destination = document.querySelector(href);
      if (!destination) {
        return;
      }
      event.preventDefault();
      destination.scrollIntoView({ behavior: 'smooth' });
    };

    anchorLinks.forEach((link) => link.addEventListener('click', handleAnchorClick));

    return () => {
      anchorLinks.forEach((link) => link.removeEventListener('click', handleAnchorClick));
    };
  }, []);

  return (
    <MainLayout showHeader={false} showFooter={false}>
      <div className="landing-root relative overflow-hidden bg-[color:var(--landing-primary)] text-[color:var(--landing-secondary)]">
        <div id="canvas-container" ref={canvasRef} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.8))]" />

        <nav className="fixed top-0 left-0 right-0 z-40 mix-blend-difference">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
            <Link to="/" className="flex items-center gap-2 landing-cursor-hover mr-6 xl:mr-10">
              <span className="xiaowu-brand xiaowu-logo-landing text-lg" aria-label="校物圈，校园物品共享平台">
                校物圈
              </span>
            </Link>
            <ul className="hidden md:flex items-center gap-10 text-[11px] tracking-[0.3em] uppercase">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="relative text-white/90 hover:text-white transition-colors landing-cursor-hover pb-1 after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-0 after:h-[1px] after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <Link
              to={primaryHref}
              className="rounded-full border border-white px-6 py-3 text-[11px] font-semibold tracking-[0.3em] uppercase text-white transition-all hover:bg-white hover:text-black landing-cursor-hover"
            >
              {primaryLabel}
            </Link>
          </div>
        </nav>

        <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-40 text-center">
          <div className="max-w-3xl">
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-[10px] tracking-[0.35em] uppercase mb-8">
              <span className="h-2 w-2 rounded-full bg-white" />
              {t('landing.badge')}
            </div>
            <h1 className="reveal font-['Playfair Display'] text-[clamp(48px,10vw,120px)] font-semibold leading-none mb-6">
              {t('landing.heroTitle')}
              <br />
              {t('landing.heroTitleAccent')}
            </h1>
            <p className="reveal mx-auto max-w-2xl text-[clamp(16px,2vw,22px)] text-white/70 leading-relaxed mb-12">
              {t('landing.heroSubtitle')}
            </p>
            <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={primaryHref}
                className="btn-primary landing-cursor-hover rounded-full bg-white px-10 py-4 text-[12px] font-semibold tracking-[0.3em] uppercase text-black transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(255,255,255,0.2)]"
              >
                {primaryLabel}
              </Link>
              <a
                href={secondaryHref}
                className="btn-secondary landing-cursor-hover rounded-full border border-white/40 px-10 py-4 text-[12px] font-semibold tracking-[0.3em] uppercase text-white transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/10"
              >
                {secondaryLabel}
              </a>
            </div>
          </div>

          <div className="absolute bottom-10 left-0 right-0">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-10 px-6">
              {stats.map((stat) => (
                <div key={stat.label} className="reveal text-center">
                  <div className="font-['Playfair Display'] text-3xl font-semibold">{stat.value}</div>
                  <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mt-2">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="relative z-10 bg-[color:var(--landing-secondary)] text-[color:var(--landing-primary)] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 reveal">
              <div className="text-[10px] tracking-[0.4em] uppercase text-black/60 mb-4">
                {t('landing.about.label')}
              </div>
              <h2 className="font-['Playfair Display'] text-[clamp(36px,5vw,64px)] font-semibold leading-tight max-w-2xl">
                {t('landing.about.titleLine1')}
                <br />
                {t('landing.about.titleLine2')}
              </h2>
            </div>
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <div className="reveal text-lg leading-relaxed text-black/70 space-y-6">
                <p>{t('landing.about.text1')}</p>
                <p>{t('landing.about.text2')}</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {aboutFeatures.map((feature) => (
                  <div
                    key={feature.title}
                    className="about-feature reveal rounded-2xl border border-black/10 p-6 transition-all hover:-translate-y-1 hover:border-black"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white text-xl">
                      {feature.icon}
                    </div>
                    <div className="text-base font-semibold mb-2">{feature.title}</div>
                    <div className="text-xs leading-relaxed text-black/60">{feature.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative z-10 py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 reveal">
              <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-4">
                {t('landing.features.label')}
              </div>
              <h2 className="font-['Playfair Display'] text-[clamp(36px,5vw,64px)] font-semibold leading-tight max-w-3xl">
                {t('landing.features.titleLine1')}
                <br />
                {t('landing.features.titleLine2')}
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featureItems.map((feature) => (
                <div
                  key={feature.title}
                  className="feature-card reveal group relative overflow-hidden rounded-3xl border border-white/10 p-10 transition-all hover:-translate-y-2 hover:border-white/30"
                >
                  <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent)]" />
                  <div className="relative">
                    <div className="font-['Playfair Display'] text-4xl text-white/10 mb-6">
                      {feature.number}
                    </div>
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 text-2xl">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-white/60">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="relative z-10 bg-[linear-gradient(180deg,#000000_0%,#0a0a0a_100%)] py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 reveal">
              <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-4">
                {t('landing.how.label')}
              </div>
              <h2 className="font-['Playfair Display'] text-[clamp(36px,5vw,64px)] font-semibold leading-tight max-w-3xl">
                {t('landing.how.titleLine1')}
                <br />
                {t('landing.how.titleLine2')}
              </h2>
            </div>
            <div className="flex flex-col gap-8">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="step reveal grid gap-8 rounded-3xl border border-white/10 p-10 transition-all hover:border-white/30 hover:bg-white/5 md:grid-cols-[100px_1fr] md:items-center"
                >
                  <div className="font-['Playfair Display'] text-5xl text-white/10">{step.number}</div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-white/60 max-w-2xl">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="download" className="relative z-10 flex items-center justify-center text-center py-24">
          <div className="max-w-3xl px-6">
            <h2 className="reveal font-['Playfair Display'] text-[clamp(42px,6vw,72px)] font-semibold leading-tight mb-6">
              {t('landing.cta.title')}
            </h2>
            <p className="reveal text-base md:text-lg text-white/60 leading-relaxed mb-12">
              {t('landing.cta.subtitle')}
            </p>
            <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={primaryHref}
                className="btn-primary landing-cursor-hover rounded-full bg-white px-10 py-4 text-[12px] font-semibold tracking-[0.3em] uppercase text-black transition-all hover:-translate-y-0.5"
              >
                {t('landing.cta.primary')}
              </Link>
              <a
                href={secondaryHref}
                className="btn-secondary landing-cursor-hover rounded-full border border-white/40 px-10 py-4 text-[12px] font-semibold tracking-[0.3em] uppercase text-white transition-all hover:-translate-y-0.5 hover:border-white"
              >
                {t('landing.cta.secondary')}
              </a>
            </div>
          </div>
        </section>

        <footer id="contact" className="relative z-10 border-t border-white/10 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr]">
              <div className="max-w-sm">
                <div className="flex items-center gap-2 mb-5 landing-cursor-hover">
                  <span className="xiaowu-brand xiaowu-logo-landing text-base" aria-label="校物圈，校园物品共享平台">
                    校物圈
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
                  {t('landing.footer.desc')}
                </p>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.35em] uppercase text-white/50 mb-6">
                  {t('landing.footer.product')}
                </div>
                <ul className="space-y-3 text-sm text-white/70">
                  <li>
                    <a href="#features" className="hover:text-white transition-colors landing-cursor-hover">{t('landing.footer.links.features')}</a>
                  </li>
                  <li>
                    <a href="#how" className="hover:text-white transition-colors landing-cursor-hover">{t('landing.footer.links.how')}</a>
                  </li>
                  <li>
                    <a href="#download" className="hover:text-white transition-colors landing-cursor-hover">{t('landing.footer.links.pricing')}</a>
                  </li>
                  <li>
                    <Link to={primaryHref} className="hover:text-white transition-colors landing-cursor-hover">{t('landing.footer.links.download')}</Link>
                  </li>
                </ul>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.35em] uppercase text-white/50 mb-6">
                  {t('landing.footer.company')}
                </div>
                <ul className="space-y-3 text-sm text-white/70">
                  <li>
                    <a href="#about" className="hover:text-white transition-colors landing-cursor-hover">{t('landing.footer.links.about')}</a>
                  </li>
                  <li>
                    <a href="#features" className="hover:text-white transition-colors landing-cursor-hover">{t('landing.footer.links.careers')}</a>
                  </li>
                  <li>
                    <a href="#features" className="hover:text-white transition-colors landing-cursor-hover">{t('landing.footer.links.press')}</a>
                  </li>
                  <li>
                    <a href="#contact" className="hover:text-white transition-colors landing-cursor-hover">{t('landing.footer.links.contact')}</a>
                  </li>
                </ul>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.35em] uppercase text-white/50 mb-6">
                  {t('landing.footer.support')}
                </div>
                <ul className="space-y-3 text-sm text-white/70">
                  <li>
                    <a href="#contact" className="hover:text-white transition-colors landing-cursor-hover">{t('landing.footer.links.help')}</a>
                  </li>
                  <li>
                    <a href="#contact" className="hover:text-white transition-colors landing-cursor-hover">{t('landing.footer.links.safety')}</a>
                  </li>
                  <li>
                    <a href="#contact" className="hover:text-white transition-colors landing-cursor-hover">{t('landing.footer.links.guidelines')}</a>
                  </li>
                  <li>
                    <a href="#contact" className="hover:text-white transition-colors landing-cursor-hover">{t('landing.footer.links.report')}</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-10 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-white/40">
                {t('landing.footer.copyright')}
              </p>
              <div className="flex gap-4">
                {['IG', 'X', 'TT', 'LI'].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-xs text-white transition-all hover:bg-white hover:text-black landing-cursor-hover"
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>

        <FloatingButton
          to={primaryHref}
          label={t('landing.floatingCta')}
          scrollTargetId="contact"
        />
      </div>
    </MainLayout>
  );
};

export default HomePage;
