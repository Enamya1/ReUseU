import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ChevronDown, FileText, ImagePlus, Plus, Search, Send } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type MessageAttachment = {
  type: 'image' | 'file';
  name: string;
  url?: string;
};

type MessageItem = {
  id: string;
  sender: 'me' | 'them';
  text?: string;
  time: string;
  attachments?: MessageAttachment[];
};

type ThreadItem = {
  id: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  messages: MessageItem[];
};

const initialThreads: ThreadItem[] = [
  {
    id: 'alex',
    name: 'Alex',
    lastMessage: 'sounds clean. send a mockup',
    lastTime: '11:28',
    messages: [
      { id: 'm1', sender: 'them', text: 'working on the minimal concept?', time: '11:23' },
      { id: 'm2', sender: 'me', text: 'yes, black & white with glass', time: '11:25' },
      { id: 'm3', sender: 'them', text: 'sounds clean. send a mockup', time: '11:28' },
    ],
  },
  {
    id: 'blake',
    name: 'Blake',
    lastMessage: 'it animates so smoothly',
    lastTime: '09:44',
    messages: [
      { id: 'm4', sender: 'them', text: 'did you see the new gradient?', time: '09:42' },
      { id: 'm5', sender: 'me', text: 'it animates so smoothly', time: '09:44' },
    ],
  },
  {
    id: 'casey',
    name: 'Casey',
    lastMessage: 'got it',
    lastTime: 'yest',
    messages: [
      { id: 'm6', sender: 'them', text: 'meeting at 4', time: 'yest' },
      { id: 'm7', sender: 'me', text: 'got it', time: 'yest' },
    ],
  },
  {
    id: 'drew',
    name: 'Drew',
    lastMessage: '— no messages',
    lastTime: '',
    messages: [],
  },
  {
    id: 'eden',
    name: 'Eden',
    lastMessage: 'Sent a file attachment',
    lastTime: '08:02',
    messages: [
      {
        id: 'm8',
        sender: 'them',
        text: 'Here is the brief.',
        time: '08:01',
      },
      {
        id: 'm9',
        sender: 'them',
        time: '08:02',
        attachments: [{ type: 'file', name: 'brief.pdf' }],
      },
    ],
  },
  {
    id: 'frank',
    name: 'Frank',
    lastMessage: 'Sent you an image',
    lastTime: 'yest',
    messages: [
      {
        id: 'm10',
        sender: 'me',
        text: 'Here is the sample image.',
        time: 'yest',
      },
      {
        id: 'm11',
        sender: 'me',
        time: 'yest',
        attachments: [{ type: 'image', name: 'sample.jpg', url: '/placeholder.svg' }],
      },
    ],
  },
];

const MessagesPage: React.FC = () => {
  const [threads, setThreads] = useState<ThreadItem[]>(initialThreads);
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreads[0]?.id ?? '');
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const attachRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03030a);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(1.8, 19.69, 29.08);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ATTRACTION_MULTIPLIER = 10.0;
    const VELOCITY_MULTIPLIER = 3.0;
    const BLACK_HOLE_VISUAL_SIZE = 5.2;
    const GLOBAL_SCALE = 0.5;

    const scaledBlackHoleSize = BLACK_HOLE_VISUAL_SIZE * GLOBAL_SCALE;
    const BLACK_HOLE_KILL_RADIUS = scaledBlackHoleSize * 1.1;
    const OUTER_MIN = 7.0 * GLOBAL_SCALE;
    const OUTER_MAX = 12.0 * GLOBAL_SCALE;

    const ambient = new THREE.AmbientLight(0x404060);
    scene.add(ambient);
    const light1 = new THREE.PointLight(0xffaa33, 1.5, 30);
    light1.position.set(5, 5, 5);
    scene.add(light1);
    const light2 = new THREE.PointLight(0x3366ff, 1.0, 30);
    light2.position.set(-5, -2, -5);
    scene.add(light2);
    const centerGlow = new THREE.PointLight(0xff5500, 0.8, 15);
    centerGlow.position.set(0, 0, 0);
    scene.add(centerGlow);

    const blackHoleGeo = new THREE.SphereGeometry(scaledBlackHoleSize, 64, 64);
    const blackHoleMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blackHole = new THREE.Mesh(blackHoleGeo, blackHoleMat);
    scene.add(blackHole);

    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 2000;
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i += 1) {
      const r = (60 + Math.random() * 40) * GLOBAL_SCALE;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      starPositions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.4;
      starPositions[i * 3 + 2] = Math.cos(phi) * r;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0x99aacc,
      size: 0.25 * GLOBAL_SCALE,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    const PARTICLE_COUNT = 2200;
    const BASE_G = 0.35;
    const DRAG = 0.006;
    const SOFTENING = 0.2;
    const BASE_TANGENTIAL_SPEED = 0.25;
    const BASE_RADIAL_SPEED = 0.04;
    const G = BASE_G * ATTRACTION_MULTIPLIER;
    const TANGENTIAL_SPEED_BASE = BASE_TANGENTIAL_SPEED * VELOCITY_MULTIPLIER;
    const RADIAL_INWARD_BASE = BASE_RADIAL_SPEED * VELOCITY_MULTIPLIER;
    const SPEED_FACTOR = 0.8;

    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const createSpriteTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.95)');
      gradient.addColorStop(0.6, 'rgba(210, 230, 255, 0.7)');
      gradient.addColorStop(0.8, 'rgba(160, 200, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    };

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      map: createSpriteTexture() ?? undefined,
      size: 0.4 * GLOBAL_SCALE,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      sizeAttenuation: true,
      opacity: 1.0,
    });

    const particles = new THREE.Points(particleGeo, particleMaterial);
    scene.add(particles);

    const velocities: THREE.Vector3[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const r = OUTER_MIN + Math.random() * (OUTER_MAX - OUTER_MIN);
      const angle = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 2.5 * GLOBAL_SCALE;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = yOffset;
      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;
      const pos = new THREE.Vector3(x, y, z);
      const rHat = pos.clone().normalize();
      const tanDir = new THREE.Vector3().crossVectors(rHat, up);
      if (tanDir.length() < 0.1) {
        tanDir.set(1, 0, 0);
      } else {
        tanDir.normalize();
      }
      const tanSpeed = TANGENTIAL_SPEED_BASE * (0.7 + 0.6 * Math.random());
      const radialSpeed = RADIAL_INWARD_BASE * (0.5 + Math.random());
      const vel = tanDir.clone().multiplyScalar(tanSpeed).add(rHat.clone().multiplyScalar(-radialSpeed));
      vel.x += (Math.random() - 0.5) * 0.03;
      vel.y += (Math.random() - 0.5) * 0.03;
      vel.z += (Math.random() - 0.5) * 0.03;
      velocities.push(vel);
    }

    particleGeo.attributes.position.needsUpdate = true;

    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;
        const pos = new THREE.Vector3(positions[ix], positions[iy], positions[iz]);
        const vel = velocities[i];
        const distSq = pos.lengthSq() + SOFTENING;
        const dirToCenter = pos.clone().negate().normalize();
        const gravStrength = G / distSq;
        const gravAcc = dirToCenter.multiplyScalar(gravStrength);
        const dragAcc = vel.clone().multiplyScalar(-DRAG);
        const acc = gravAcc.add(dragAcc);
        vel.add(acc.multiplyScalar(delta * SPEED_FACTOR));
        if (vel.length() > 1.2) vel.normalize().multiplyScalar(1.2);
        pos.add(vel.clone().multiplyScalar(delta * SPEED_FACTOR));
        if (pos.length() < BLACK_HOLE_KILL_RADIUS) {
          const newR = OUTER_MIN + Math.random() * (OUTER_MAX - OUTER_MIN);
          const newAngle = Math.random() * Math.PI * 2;
          const newY = (Math.random() - 0.5) * 2.5 * GLOBAL_SCALE;
          pos.set(Math.cos(newAngle) * newR, newY, Math.sin(newAngle) * newR);
          const rHatNew = pos.clone().normalize();
          const tanDirNew = new THREE.Vector3().crossVectors(rHatNew, up);
          if (tanDirNew.length() < 0.1) {
            tanDirNew.set(1, 0, 0);
          } else {
            tanDirNew.normalize();
          }
          const tanSpeedNew = TANGENTIAL_SPEED_BASE * (0.7 + 0.6 * Math.random());
          const radialSpeedNew = RADIAL_INWARD_BASE * (0.5 + Math.random());
          vel.copy(tanDirNew.multiplyScalar(tanSpeedNew).add(rHatNew.clone().multiplyScalar(-radialSpeedNew)));
          vel.x += (Math.random() - 0.5) * 0.03;
          vel.y += (Math.random() - 0.5) * 0.03;
          vel.z += (Math.random() - 0.5) * 0.03;
        }
        positions[ix] = pos.x;
        positions[iy] = pos.y;
        positions[iz] = pos.z;
      }
      particleGeo.attributes.position.needsUpdate = true;
      stars.rotation.y += 0.0001;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(frameId);
      starsGeo.dispose();
      starsMat.dispose();
      particleGeo.dispose();
      particleMaterial.dispose();
      blackHoleGeo.dispose();
      blackHoleMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!attachRef.current) return;
      if (!attachRef.current.contains(event.target as Node)) {
        setAttachOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredThreads = useMemo(() => {
    if (!searchTerm.trim()) return threads;
    const term = searchTerm.trim().toLowerCase();
    return threads.filter((thread) => thread.name.toLowerCase().includes(term));
  }, [searchTerm, threads]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );

  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;
    const handleScroll = () => {
      const threshold = 40;
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      setIsAtBottom(distanceFromBottom <= threshold);
    };
    handleScroll();
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [selectedThreadId]);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;
    if (!isAtBottom) return;
    container.scrollTop = container.scrollHeight;
  }, [isAtBottom, selectedThreadId, selectedThread?.messages.length]);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  const handlePickFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAttachments((prev) => [...prev, ...Array.from(files)]);
  };

  const handleSend = () => {
    if (!selectedThread) return;
    if (!messageInput.trim() && attachments.length === 0) return;
    const nextAttachments: MessageAttachment[] = attachments.map((file) => ({
      type: file.type.startsWith('image/') ? 'image' : 'file',
      name: file.name,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    const newMessage: MessageItem = {
      id: `m-${Date.now()}`,
      sender: 'me',
      text: messageInput.trim() || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: nextAttachments.length > 0 ? nextAttachments : undefined,
    };
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === selectedThread.id
          ? {
              ...thread,
              lastMessage: newMessage.text || (newMessage.attachments?.[0]?.name ?? 'Attachment'),
              lastTime: newMessage.time,
              messages: [...thread.messages, newMessage],
            }
          : thread,
      ),
    );
    setMessageInput('');
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const headerClassName =
    "bg-black/25 border-b border-white/10 mix-blend-normal [&_a]:text-white [&_a:hover]:text-white [&_button]:text-white [&_button:hover]:text-white [&_svg]:text-white/80 [&_input]:bg-white/5 [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder:text-white/60";

  return (
    <MainLayout showFooter={false} showFloatingButton={false} headerClassName={headerClassName}>
      <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-black">
        <div ref={canvasRef} className="absolute inset-0" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex h-[calc(100vh-80px)] w-full overflow-hidden text-white">
          <aside className="flex w-[320px] flex-col border-r border-white/10 bg-black/60">
            <div className="px-5 pt-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search users..."
                  className="h-11 rounded-full border-white/20 bg-white/5 pl-11 text-sm text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm italic text-white/60">no users found</div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = thread.id === selectedThreadId;
                  const initial = thread.name.charAt(0).toUpperCase();
                  return (
                    <button
                      key={thread.id}
                      onClick={() => handleSelectThread(thread.id)}
                      className={cn(
                        'flex w-full items-center gap-4 border-b border-white/5 px-6 py-4 text-left transition-colors',
                        isActive ? 'bg-white/10' : 'hover:bg-white/5',
                      )}
                    >
                      <Avatar className="h-11 w-11 bg-white text-black shadow-lg">
                        <AvatarFallback className="bg-white text-black">{initial}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white">{thread.name}</div>
                        <div className="truncate text-xs text-white/60">{thread.lastMessage}</div>
                      </div>
                      <div className="text-[11px] text-white/50">{thread.lastTime}</div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex flex-1 flex-col border-l border-white/10 bg-black/25">
            <div className="flex items-center justify-between border-b border-white/10 bg-black/25 px-8 py-6 text-base font-light tracking-[0.03em]">
              <span>{selectedThread ? selectedThread.name : 'select a contact'}</span>
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div ref={messageListRef} className="flex-1 space-y-4 overflow-y-auto bg-black/25 px-8 py-6">
              {selectedThread && selectedThread.messages.length > 0 ? (
                selectedThread.messages.map((message) => {
                  const isMe = message.sender === 'me';
                  return (
                    <div
                      key={message.id}
                      className={cn('flex max-w-[68%] flex-col gap-2', isMe ? 'ml-auto items-end' : 'items-start')}
                    >
                      <div
                        className={cn(
                          'rounded-[22px] border border-white/10 px-5 py-3 text-sm leading-relaxed shadow-lg',
                          isMe ? 'bg-white/5 text-white rounded-br-md' : 'bg-black/40 text-white/90 rounded-bl-md',
                        )}
                      >
                        {message.text ? <p>{message.text}</p> : null}
                        {message.attachments && message.attachments.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {message.attachments.map((attachment, index) =>
                              attachment.type === 'image' ? (
                                <div key={`${message.id}-img-${index}`} className="overflow-hidden rounded-2xl border border-white/10">
                                  <img
                                    src={attachment.url || '/placeholder.svg'}
                                    alt={attachment.name}
                                    className="h-40 w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div
                                  key={`${message.id}-file-${index}`}
                                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span>{attachment.name}</span>
                                </div>
                              ),
                            )}
                          </div>
                        ) : null}
                      </div>
                      <div className="px-2 text-[11px] text-white/60">{message.time}</div>
                    </div>
                  );
                })
              ) : (
                <div className="mt-10 rounded-[28px] bg-black/15 px-6 py-5 text-center text-sm text-white/70">
                  ◀︎ choose a friend from the sidebar
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-white/10 bg-black/25 px-8 py-5">
              <div ref={attachRef} className="relative flex items-center">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handlePickFiles(event.target.files)}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(event) => handlePickFiles(event.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    setAttachOpen((prev) => !prev);
                  }}
                  className="h-12 w-12 rounded-full border-white/30 bg-white/3 text-white hover:bg-white/5"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                {attachOpen ? (
                  <div className="absolute bottom-14 left-0 z-20 w-[170px] rounded-2xl border border-white/10 bg-black/60 py-2 shadow-2xl backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() => {
                        imageInputRef.current?.click();
                        setAttachOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-5 py-3 text-sm text-white/90 hover:bg-white/5"
                    >
                      <ImagePlus className="h-4 w-4" />
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setAttachOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-5 py-3 text-sm text-white/90 hover:bg-white/5"
                    >
                      <FileText className="h-4 w-4" />
                      File
                    </button>
                  </div>
                ) : null}
              </div>

              <Input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder="type a message..."
                className="h-12 flex-1 rounded-full border-white/20 bg-white/5 px-6 text-sm text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type="button"
                onClick={handleSend}
                className="h-12 rounded-full border border-white/30 bg-white/5 px-8 text-sm font-normal text-white hover:bg-white/10"
              >
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  send
                </span>
              </Button>
            </div>
            {attachments.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-t border-white/10 bg-black/25 px-8 py-3">
                {attachments.map((file, index) => (
                  <Badge key={`${file.name}-${index}`} className="border-0 bg-white/5 text-white/80">
                    {file.name}
                  </Badge>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default MessagesPage;
