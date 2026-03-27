import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Ban, CalendarClock, Check, CheckCheck, ChevronDown, ChevronUp, Clock, DollarSign, FileText, ImagePlus, MapPin, Plus, Search, Send, ArrowRightLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { normalizeImageUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type MessageAttachment = {
  type: 'image' | 'file';
  name: string;
  url?: string;
};

type TransferData = {
  amount: number;
  currency: string;
  from_wallet_id: number;
  to_wallet_id: number;
  transaction_ledger_id: number;
  atomic_transaction_id: number;
  sender_username: string;
  reference?: string;
};

type PaymentRequestData = {
  payment_request_id?: number;
  amount: number;
  currency: string;
  product_id?: number | null;
  product_title?: string | null;
  sender_username?: string;
  receiver_id?: number;
  expires_at?: string;
  status?: string;
  reference?: string;
};

type MessageItem = {
  id: string;
  sender: 'me' | 'them';
  text?: string;
  time: string;
  attachments?: MessageAttachment[];
  status?: 'sent' | 'read' | 'pending' | 'blocked';
  messageType?: 'text' | 'transfer' | 'voice' | 'payment_request' | 'payment_confirmation';
  messageKind?: 'normal' | 'payment_request_unconfirmed' | 'payment_request_confirmed' | 'transfer';
  transferData?: TransferData;
  paymentRequestData?: PaymentRequestData;
};

type ThreadItem = {
  id: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  messages: MessageItem[];
  conversationId?: number;
  avatarUrl?: string;
};

type MyProductCard = {
  id: number;
  title: string;
  price: number;
  currency?: string;
  status: 'available' | 'sold' | 'reserved';
  image_thumbnail_url?: string | null;
};

type MessageThreadEntry = {
  id?: number | string;
  sender_id?: number | string;
  message_text?: string;
  message_type?: string;
  message_kind?: string;
  payment_request_status?: string | null;
  transfer_data?: Record<string, unknown> | null;
  read_at?: string | null;
  created_at?: string;
};

const initialThreads: ThreadItem[] = [];

// Popular currencies list with MAD as default
const POPULAR_CURRENCIES = [
  { code: 'MAD', name: 'Moroccan Dirham' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'AED', name: 'UAE Dirham' },
];

const MessagesPage: React.FC = () => {
  const [threads, setThreads] = useState<ThreadItem[]>(initialThreads);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pinnedThreadIds, setPinnedThreadIds] = useState<string[]>([]);
  const [mutedThreadIds, setMutedThreadIds] = useState<string[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferCurrency, setTransferCurrency] = useState('CNY');
  const [transferReference, setTransferReference] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [showPaymentRequestDialog, setShowPaymentRequestDialog] = useState(false);
  const [paymentRequestAmount, setPaymentRequestAmount] = useState('');
  const [paymentRequestCurrency, setPaymentRequestCurrency] = useState('CNY');
  const [paymentRequestMessage, setPaymentRequestMessage] = useState('');
  const [paymentRequestExpiresIn, setPaymentRequestExpiresIn] = useState('24');
  const [paymentRequestProductId, setPaymentRequestProductId] = useState<number | null>(null);
  const [myProducts, setMyProducts] = useState<MyProductCard[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isPaymentRequesting, setIsPaymentRequesting] = useState(false);
  const [activePaymentRequest, setActivePaymentRequest] = useState<PaymentRequestData | null>(null);
  const [showPaymentConfirmDialog, setShowPaymentConfirmDialog] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingNote, setMeetingNote] = useState('');
  const [isSendingMeeting, setIsSendingMeeting] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const attachRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isAuthenticated,
    user,
    sendMessage,
    getMessageContacts,
    getMessages,
    transferMessage,
    createPaymentRequest,
    confirmPaymentRequest,
    getMyProductCards,
  } = useAuth();

  const receiverId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('receiverId') || params.get('receiver_id');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [location.search]);

  const receiverName = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('receiverName') || params.get('receiver_name') || '';
  }, [location.search]);

  const conversationId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('conversationId') || params.get('conversation_id');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [location.search]);


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
    const term = searchTerm.trim().toLowerCase();
    const baseThreads = term ? threads.filter((thread) => thread.name.toLowerCase().includes(term)) : threads;
    if (pinnedThreadIds.length === 0) return baseThreads;
    const pinnedSet = new Set(pinnedThreadIds);
    const pinned = baseThreads.filter((thread) => pinnedSet.has(thread.id));
    const rest = baseThreads.filter((thread) => !pinnedSet.has(thread.id));
    return [...pinned, ...rest];
  }, [pinnedThreadIds, searchTerm, threads]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );
  const selectedHandle = selectedThread ? `@${selectedThread.id}` : '';
  const selectedLastActivity = selectedThread
    ? selectedThread.messages[selectedThread.messages.length - 1]?.time || selectedThread.lastTime || '—'
    : '—';
  const isPinned = selectedThread ? pinnedThreadIds.includes(selectedThread.id) : false;
  const isMuted = selectedThread ? mutedThreadIds.includes(selectedThread.id) : false;

  const formatTimeLabel = useCallback((value?: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatCurrency = useCallback((amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch (e) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }, []);

  const mapMessageThread = useCallback(
    (messages: MessageThreadEntry[], otherUser?: { id?: number | string }) => {
      return (messages ?? []).map((message) => {
        const senderId = typeof message.sender_id === 'string' ? Number(message.sender_id) : message.sender_id;
        const currentUserId = typeof user?.id === 'string' ? Number(user.id) : user?.id;
        const otherUserId = typeof otherUser?.id === 'string' ? Number(otherUser.id) : otherUser?.id;
        const isMe =
          Number.isFinite(senderId) &&
          ((Number.isFinite(currentUserId) && senderId === currentUserId) ||
            (Number.isFinite(otherUserId) && senderId !== otherUserId));
        const timeLabel = formatTimeLabel(message.created_at);

        let transferData: TransferData | undefined;
        if (message.message_type === 'transfer' && message.transfer_data) {
          try {
            const td = message.transfer_data as Record<string, unknown>;
            transferData = {
              amount: typeof td.amount === 'number' ? td.amount : Number(td.amount || 0),
              currency: typeof td.currency === 'string' ? td.currency : String(td.currency || ''),
              from_wallet_id: typeof td.from_wallet_id === 'number' ? td.from_wallet_id : Number(td.from_wallet_id || 0),
              to_wallet_id: typeof td.to_wallet_id === 'number' ? td.to_wallet_id : Number(td.to_wallet_id || 0),
              transaction_ledger_id:
                typeof td.transaction_ledger_id === 'number' ? td.transaction_ledger_id : Number(td.transaction_ledger_id || 0),
              atomic_transaction_id:
                typeof td.atomic_transaction_id === 'number' ? td.atomic_transaction_id : Number(td.atomic_transaction_id || 0),
              sender_username: typeof td.sender_username === 'string' ? td.sender_username : String(td.sender_username || ''),
              reference: td.reference ? String(td.reference) : undefined,
            };
          } catch (e) {
            console.warn('Failed to parse transfer data:', e);
          }
        }

        let paymentRequestData: PaymentRequestData | undefined;
        if (
          (message.message_type === 'payment_request' || message.message_type === 'payment_confirmation') &&
          message.transfer_data
        ) {
          try {
            const td = message.transfer_data as Record<string, unknown>;
            const paymentRequestId =
              typeof td.payment_request_id === 'number'
                ? td.payment_request_id
                : typeof td.payment_request_id === 'string'
                  ? Number(td.payment_request_id)
                  : undefined;
            const productId =
              typeof td.product_id === 'number'
                ? td.product_id
                : typeof td.product_id === 'string'
                  ? Number(td.product_id)
                  : undefined;
            paymentRequestData = {
              payment_request_id: paymentRequestId,
              amount: typeof td.amount === 'number' ? td.amount : Number(td.amount || 0),
              currency: typeof td.currency === 'string' ? td.currency : String(td.currency || ''),
              product_id: productId,
              product_title: td.product_title ? String(td.product_title) : undefined,
              sender_username: td.sender_username ? String(td.sender_username) : undefined,
              receiver_id:
                typeof td.receiver_id === 'number'
                  ? td.receiver_id
                  : typeof td.receiver_id === 'string'
                    ? Number(td.receiver_id)
                    : undefined,
              expires_at: td.expires_at ? String(td.expires_at) : undefined,
              status:
                message.payment_request_status ||
                (td.status ? String(td.status) : undefined),
              reference: td.reference ? String(td.reference) : undefined,
            };
          } catch (e) {
            console.warn('Failed to parse payment request data:', e);
          }
        }

        return {
          id: message.id ? `m-${message.id}` : `m-${Math.random().toString(36).slice(2)}`,
          sender: isMe ? 'me' : 'them',
          text: message.message_text?.trim() || undefined,
          time: timeLabel,
          status: isMe ? (message.read_at ? 'read' : 'sent') : undefined,
          messageType: (message.message_type as MessageItem['messageType']) || 'text',
          messageKind: (message.message_kind as MessageItem['messageKind']) || 'normal',
          transferData,
          paymentRequestData,
        } as MessageItem;
      });
    },
    [formatTimeLabel, user?.id],
  );

  useEffect(() => {
    setShowSearchHistory(false);
    setSearchQuery('');
    setSearchMatches([]);
    setCurrentMatchIndex(0);
  }, [selectedThreadId]);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [selectedThreadId, selectedThread?.messages.length]);

  useEffect(() => {
    if (!isAuthenticated || !selectedThread?.conversationId) return;
    let cancelled = false;
    const run = async () => {
      try {
        const response = await getMessages({ conversation_id: selectedThread.conversationId, limit: 50 });
        if (cancelled) return;
        const otherUser = response.conversation?.other_user;
        const mappedMessages = mapMessageThread(response.messages ?? [], otherUser);
        const lastMessage = mappedMessages[mappedMessages.length - 1];
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === selectedThread.id
              ? {
                  ...thread,
                  name: otherUser?.username?.trim() || thread.name,
                  messages: mappedMessages,
                  lastMessage: lastMessage?.text || thread.lastMessage,
                  lastTime: lastMessage?.time || thread.lastTime,
                  conversationId: response.conversation?.id ?? thread.conversationId,
                }
              : thread,
          ),
        );
      } catch (error) {
        if (cancelled) return;
        const message = (error as { message?: string; errors?: Record<string, string[]> } | undefined)?.message;
        const errors = (error as { errors?: Record<string, string[]> } | undefined)?.errors;
        const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
        toast({
          title: 'Unable to load messages',
          description: firstError || message || 'Please try again.',
        });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [formatTimeLabel, getMessages, isAuthenticated, mapMessageThread, selectedThread?.conversationId, selectedThread?.id, user?.id]);

  useEffect(() => {
    if (!showPaymentRequestDialog || !isAuthenticated) return;
    let cancelled = false;
    const run = async () => {
      setIsLoadingProducts(true);
      try {
        const response = await getMyProductCards({ page_size: 50 });
        if (cancelled) return;
        const products = (response.products ?? []).map((product) => ({
          id: product.id,
          title: product.title,
          price: product.price,
          currency: product.currency,
          status: product.status,
          image_thumbnail_url: product.image_thumbnail_url,
        }));
        setMyProducts(products);
        if (products.length > 0 && paymentRequestProductId === null) {
          setPaymentRequestProductId(products[0].id);
        }
      } catch (error) {
        const message = (error as { message?: string; errors?: Record<string, string[]> } | undefined)?.message;
        const errors = (error as { errors?: Record<string, string[]> } | undefined)?.errors;
        const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
        toast({
          title: 'Unable to load products',
          description: firstError || message || 'Please try again.',
        });
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [getMyProductCards, isAuthenticated, paymentRequestProductId, showPaymentRequestDialog]);

  const scrollToMatch = (index: number, matches = searchMatches) => {
    if (!selectedThread || matches.length === 0) return;
    const message = selectedThread.messages[matches[index]];
    if (!message) return;
    const el = messageRefs.current[message.id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSearchInThread = () => {
    if (!selectedThread) return;
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchMatches([]);
      setCurrentMatchIndex(0);
      return;
    }
    const matches = selectedThread.messages
      .map((message, index) => ({
        index,
        text: [message.text, ...(message.attachments?.map((attachment) => attachment.name) ?? [])]
          .join(' ')
          .toLowerCase(),
      }))
      .filter((entry) => entry.text.includes(query))
      .map((entry) => entry.index);
    setSearchMatches(matches);
    setCurrentMatchIndex(0);
    if (matches.length > 0) {
      scrollToMatch(0, matches);
    }
  };

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(nextIndex);
  };

  const handlePreviousMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(prevIndex);
  };

  const handleTogglePin = () => {
    if (!selectedThread) return;
    setPinnedThreadIds((prev) =>
      prev.includes(selectedThread.id) ? prev.filter((id) => id !== selectedThread.id) : [selectedThread.id, ...prev],
    );
  };

  const handleToggleMute = () => {
    if (!selectedThread) return;
    setMutedThreadIds((prev) =>
      prev.includes(selectedThread.id) ? prev.filter((id) => id !== selectedThread.id) : [...prev, selectedThread.id],
    );
  };

  const orderThreadsByActivity = useCallback((currentThreads: ThreadItem[], updatedThreadId?: string) => {
    const pinnedSet = new Set(pinnedThreadIds);
    const pinned = currentThreads.filter((thread) => pinnedSet.has(thread.id));
    const unpinned = currentThreads.filter((thread) => !pinnedSet.has(thread.id));
    if (updatedThreadId && !pinnedSet.has(updatedThreadId)) {
      const index = unpinned.findIndex((thread) => thread.id === updatedThreadId);
      if (index > 0) {
        const [updated] = unpinned.splice(index, 1);
        unpinned.unshift(updated);
      }
    }
    return [...pinned, ...unpinned];
  }, [pinnedThreadIds]);

  useEffect(() => {
    if (!isAuthenticated) {
      setThreads([]);
      setSelectedThreadId('');
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const response = await getMessageContacts({ limit: 20 });
        if (cancelled) return;
        const mapped = (response.contacts ?? [])
          .map((contact) => {
            const userId = contact.user?.id;
            if (!userId) return null;
            const name = contact.user?.username?.trim() || `User ${userId}`;
            const lastMessage = contact.last_message?.message_text?.trim() || '—';
            const lastTime = formatTimeLabel(contact.last_message?.created_at);
            return {
              id: String(userId),
              name,
              lastMessage,
              lastTime,
              messages: [],
              conversationId: contact.conversation_id,
              avatarUrl: contact.user?.profile_picture,
            } as ThreadItem;
          })
          .filter((item): item is ThreadItem => item !== null);
        setThreads((prev) => {
          const merged = new Map(prev.map((thread) => [thread.id, thread]));
          mapped.forEach((thread) => {
            const existing = merged.get(thread.id);
            merged.set(
              thread.id,
              existing
                ? {
                    ...thread,
                    messages: existing.messages,
                    conversationId: existing.conversationId ?? thread.conversationId,
                    avatarUrl: existing.avatarUrl ?? thread.avatarUrl,
                  }
                : thread,
            );
          });
          return orderThreadsByActivity(Array.from(merged.values()));
        });
        if (!selectedThreadId && !receiverId && mapped.length > 0) {
          setSelectedThreadId(mapped[0].id);
        }
      } catch (error) {
        if (cancelled) return;
        const message = (error as { message?: string; errors?: Record<string, string[]> } | undefined)?.message;
        const errors = (error as { errors?: Record<string, string[]> } | undefined)?.errors;
        const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
        toast({
          title: 'Unable to load contacts',
          description: firstError || message || 'Please try again.',
        });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [formatTimeLabel, getMessageContacts, isAuthenticated, orderThreadsByActivity, receiverId, selectedThreadId]);

  useEffect(() => {
    if (!receiverId) return;
    const threadId = String(receiverId);
    setThreads((prev) => {
      if (prev.some((thread) => thread.id === threadId)) return prev;
      const name = receiverName.trim() || `User ${receiverId}`;
      const nextThreads = [
        {
          id: threadId,
          name,
          lastMessage: '—',
          lastTime: '',
          messages: [],
          conversationId: conversationId ?? undefined,
        },
        ...prev,
      ];
      return orderThreadsByActivity(nextThreads, threadId);
    });
    setSelectedThreadId(threadId);
  }, [conversationId, orderThreadsByActivity, receiverId, receiverName]);

  useEffect(() => {
    if (!conversationId) return;
    const match = threads.find((thread) => thread.conversationId === conversationId);
    if (match) {
      setSelectedThreadId(match.id);
      return;
    }
    if (!receiverId) return;
    const threadId = String(receiverId);
    setThreads((prev) => {
      if (prev.some((thread) => thread.id === threadId)) return prev;
      const name = receiverName.trim() || `User ${receiverId}`;
      const nextThreads = [
        {
          id: threadId,
          name,
          lastMessage: '—',
          lastTime: '',
          messages: [],
          conversationId,
        },
        ...prev,
      ];
      return orderThreadsByActivity(nextThreads, threadId);
    });
    setSelectedThreadId(threadId);
  }, [conversationId, orderThreadsByActivity, receiverId, receiverName, threads]);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  const handlePickFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAttachments((prev) => [...prev, ...Array.from(files)]);
  };

  const handleSend = async () => {
    if (!selectedThread) return;
    if (!messageInput.trim() && attachments.length === 0) return;
    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please log in to send a message.',
      });
      navigate('/login');
      return;
    }
    if (attachments.length > 0) {
      toast({
        title: 'Attachments not supported yet',
        description: 'Please send text messages only.',
      });
      return;
    }
    const trimmed = messageInput.trim();
    if (!trimmed) return;
    const receiverIdValue = Number(selectedThread.id);
    if (!Number.isFinite(receiverIdValue)) {
      toast({
        title: 'Unable to send message',
        description: 'Missing receiver information.',
      });
      return;
    }
    try {
      const response = await sendMessage({ receiver_id: receiverIdValue, message_text: trimmed });
      const createdAt = response.message_data?.created_at;
      const timeLabel = createdAt
        ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMessage: MessageItem = {
        id: response.message_data?.id ? `m-${response.message_data.id}` : `m-${Date.now()}`,
        sender: 'me',
        text: response.message_data?.message_text || trimmed,
        time: timeLabel,
        status: 'sent',
      };
      setThreads((prev) => {
        const updatedThreads = prev.map((thread) =>
          thread.id === selectedThread.id
            ? {
                ...thread,
                lastMessage: newMessage.text || 'Message',
                lastTime: newMessage.time,
                messages: [...thread.messages, newMessage],
                conversationId: thread.conversationId ?? response.conversation_id,
              }
            : thread,
        );
        return orderThreadsByActivity(updatedThreads, selectedThread.id);
      });
      setMessageInput('');
      setAttachments([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    } catch (error) {
      const message = (error as { message?: string; errors?: Record<string, string[]> } | undefined)?.message;
      const errors = (error as { errors?: Record<string, string[]> } | undefined)?.errors;
      const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
      toast({
        title: 'Unable to send message',
        description: firstError || message || 'Please try again.',
      });
    }
  };

  const handleTransfer = async () => {
    if (!selectedThread?.conversationId) {
      toast({
        title: 'Unable to transfer',
        description: 'Conversation not found.',
      });
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount < 0.01) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount (minimum 0.01).',
      });
      return;
    }

    if (!transferCurrency) {
      toast({
        title: 'Invalid currency',
        description: 'Please select a currency.',
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please log in to transfer money.',
      });
      navigate('/login');
      return;
    }

    setIsTransferring(true);

    try {
      const response = await transferMessage({
        conversation_id: selectedThread.conversationId,
        amount,
        currency: transferCurrency,
        reference: transferReference.trim() || undefined,
      });

      toast({
        title: 'Transfer completed successfully',
        description: `Transferred ${amount} ${transferCurrency}${transferReference.trim() ? ` - ${transferReference}` : ''}`,
      });

      // Reload messages to show the transfer message
      try {
        const messagesResponse = await getMessages({ conversation_id: selectedThread.conversationId, limit: 50 });
        const otherUser = messagesResponse.conversation?.other_user;
        const mappedMessages = mapMessageThread(messagesResponse.messages ?? [], otherUser);
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === selectedThread.id
              ? {
                  ...thread,
                  messages: mappedMessages,
                  lastMessage: mappedMessages[mappedMessages.length - 1]?.text || thread.lastMessage,
                  lastTime: mappedMessages[mappedMessages.length - 1]?.time || thread.lastTime,
                }
              : thread,
          ),
        );
      } catch (error) {
        // Ignore error when reloading messages
      }

      setShowTransferDialog(false);
      setTransferAmount('');
      setTransferCurrency('CNY');
      setTransferReference('');
    } catch (error) {
      const message = (error as { message?: string; errors?: Record<string, string[]> } | undefined)?.message;
      const errors = (error as { errors?: Record<string, string[]> } | undefined)?.errors;
      const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
      toast({
        title: 'Unable to complete transfer',
        description: firstError || message || 'Please try again.',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleOpenPaymentRequest = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please log in to request a payment.',
      });
      navigate('/login');
      return;
    }
    setShowPaymentRequestDialog(true);
  };

  const handlePaymentRequest = async () => {
    if (!selectedThread?.conversationId) {
      toast({
        title: 'Unable to request payment',
        description: 'Conversation not found.',
      });
      return;
    }

    const amount = parseFloat(paymentRequestAmount);
    if (isNaN(amount) || amount < 0.01) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount (minimum 0.01).',
      });
      return;
    }

    if (!paymentRequestCurrency) {
      toast({
        title: 'Invalid currency',
        description: 'Please select a currency.',
      });
      return;
    }

    if (myProducts.length > 0 && paymentRequestProductId === null) {
      toast({
        title: 'Select a product',
        description: 'Please choose a product to attach to this request.',
      });
      return;
    }

    const expiresInValue = paymentRequestExpiresIn.trim()
      ? Number.parseInt(paymentRequestExpiresIn, 10)
      : undefined;
    if (typeof expiresInValue === 'number' && (Number.isNaN(expiresInValue) || expiresInValue < 1 || expiresInValue > 720)) {
      toast({
        title: 'Invalid expiration',
        description: 'Expiration must be between 1 and 720 hours.',
      });
      return;
    }

    setIsPaymentRequesting(true);

    try {
      await createPaymentRequest({
        conversation_id: selectedThread.conversationId,
        product_id: paymentRequestProductId ?? undefined,
        amount,
        currency: paymentRequestCurrency,
        message: paymentRequestMessage.trim() || undefined,
        expires_in_hours: expiresInValue,
      });

      toast({
        title: 'Payment request sent',
        description: `Requested ${amount} ${paymentRequestCurrency}${paymentRequestMessage.trim() ? ` - ${paymentRequestMessage}` : ''}`,
      });

      try {
        const messagesResponse = await getMessages({ conversation_id: selectedThread.conversationId, limit: 50 });
        const otherUser = messagesResponse.conversation?.other_user;
        const mappedMessages = mapMessageThread(messagesResponse.messages ?? [], otherUser);
        const lastMessage = mappedMessages[mappedMessages.length - 1];
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === selectedThread.id
              ? {
                  ...thread,
                  messages: mappedMessages,
                  lastMessage: lastMessage?.text || thread.lastMessage,
                  lastTime: lastMessage?.time || thread.lastTime,
                  conversationId: messagesResponse.conversation?.id ?? thread.conversationId,
                }
              : thread,
          ),
        );
      } catch (error) {
        // ignore
      }

      setShowPaymentRequestDialog(false);
      setPaymentRequestAmount('');
      setPaymentRequestCurrency('CNY');
      setPaymentRequestMessage('');
      setPaymentRequestExpiresIn('24');
    } catch (error) {
      const message = (error as { message?: string; errors?: Record<string, string[]> } | undefined)?.message;
      const errors = (error as { errors?: Record<string, string[]> } | undefined)?.errors;
      const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
      toast({
        title: 'Unable to request payment',
        description: firstError || message || 'Please try again.',
      });
    } finally {
      setIsPaymentRequesting(false);
    }
  };

  const handleConfirmPaymentRequest = async () => {
    if (!activePaymentRequest?.payment_request_id) {
      toast({
        title: 'Unable to confirm',
        description: 'Payment request not found.',
      });
      return;
    }

    if (!selectedThread?.conversationId) {
      toast({
        title: 'Unable to confirm',
        description: 'Conversation not found.',
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please log in to confirm payment.',
      });
      navigate('/login');
      return;
    }

    setIsConfirmingPayment(true);

    try {
      await confirmPaymentRequest(activePaymentRequest.payment_request_id);
      toast({
        title: 'Payment confirmed',
        description: `Paid ${activePaymentRequest.amount} ${activePaymentRequest.currency}`,
      });

      try {
        const messagesResponse = await getMessages({ conversation_id: selectedThread.conversationId, limit: 50 });
        const otherUser = messagesResponse.conversation?.other_user;
        const mappedMessages = mapMessageThread(messagesResponse.messages ?? [], otherUser);
        const lastMessage = mappedMessages[mappedMessages.length - 1];
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === selectedThread.id
              ? {
                  ...thread,
                  messages: mappedMessages,
                  lastMessage: lastMessage?.text || thread.lastMessage,
                  lastTime: lastMessage?.time || thread.lastTime,
                  conversationId: messagesResponse.conversation?.id ?? thread.conversationId,
                }
              : thread,
          ),
        );
      } catch (error) {
        // ignore
      }

      setShowPaymentConfirmDialog(false);
      setActivePaymentRequest(null);
    } catch (error) {
      const message = (error as { message?: string; errors?: Record<string, string[]> } | undefined)?.message;
      const errors = (error as { errors?: Record<string, string[]> } | undefined)?.errors;
      const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
      toast({
        title: 'Unable to confirm payment',
        description: firstError || message || 'Please try again.',
      });
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleMeetingRequest = async () => {
    if (!selectedThread) return;
    if (!meetingLocation.trim() || !meetingDate || !meetingTime) {
      toast({
        title: 'Missing details',
        description: 'Please add a location, date, and time.',
      });
      return;
    }
    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please log in to send a meeting request.',
      });
      navigate('/login');
      return;
    }
    const receiverIdValue = Number(selectedThread.id);
    if (!Number.isFinite(receiverIdValue)) {
      toast({
        title: 'Unable to send request',
        description: 'Missing receiver information.',
      });
      return;
    }

    const noteText = meetingNote.trim() ? `Note: ${meetingNote.trim()}` : '';
    const messageText = [
      'Meeting request',
      `Location: ${meetingLocation.trim()}`,
      `Date: ${meetingDate}`,
      `Time: ${meetingTime}`,
      noteText,
    ]
      .filter(Boolean)
      .join('\n');

    setIsSendingMeeting(true);
    try {
      const response = await sendMessage({ receiver_id: receiverIdValue, message_text: messageText });
      const createdAt = response.message_data?.created_at;
      const timeLabel = createdAt
        ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMessage: MessageItem = {
        id: response.message_data?.id ? `m-${response.message_data.id}` : `m-${Date.now()}`,
        sender: 'me',
        text: response.message_data?.message_text || messageText,
        time: timeLabel,
        status: 'sent',
      };
      setThreads((prev) => {
        const updatedThreads = prev.map((thread) =>
          thread.id === selectedThread.id
            ? {
                ...thread,
                lastMessage: newMessage.text || 'Message',
                lastTime: newMessage.time,
                messages: [...thread.messages, newMessage],
                conversationId: thread.conversationId ?? response.conversation_id,
              }
            : thread,
        );
        return orderThreadsByActivity(updatedThreads, selectedThread.id);
      });
      setShowMeetingDialog(false);
      setMeetingLocation('');
      setMeetingDate('');
      setMeetingTime('');
      setMeetingNote('');
    } catch (error) {
      const message = (error as { message?: string; errors?: Record<string, string[]> } | undefined)?.message;
      const errors = (error as { errors?: Record<string, string[]> } | undefined)?.errors;
      const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
      toast({
        title: 'Unable to send request',
        description: firstError || message || 'Please try again.',
      });
    } finally {
      setIsSendingMeeting(false);
    }
  };

  const headerClassName =
    "bg-black/25 mix-blend-normal [&_a]:text-white [&_a:hover]:text-white [&_button]:text-white [&_button:hover]:text-white [&_svg]:text-white/80 [&_input]:bg-white/5 [&_input]:text-white [&_input]:placeholder:text-white/60";
  const paymentConfirmExpiresAt = activePaymentRequest?.expires_at ? new Date(activePaymentRequest.expires_at) : null;
  const paymentConfirmExpired = paymentConfirmExpiresAt ? paymentConfirmExpiresAt.getTime() < Date.now() : false;
  const paymentConfirmStatus = activePaymentRequest?.status || 'pending';
  const canConfirmPayment =
    !!activePaymentRequest && !paymentConfirmExpired && (paymentConfirmStatus === 'pending' || paymentConfirmStatus === 'created');

  return (
    <MainLayout showFooter={false} showFloatingButton={false} headerClassName={headerClassName}>
      <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-black">
        <div ref={canvasRef} className="absolute inset-0" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex h-[calc(100vh-80px)] w-full overflow-hidden text-white">
          <aside className="flex w-[320px] flex-col bg-black/60">
            <div className="px-5 pt-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search users..."
                  className="h-11 rounded-full bg-white/5 pl-11 text-sm text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm italic text-white/60">no users found</div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = thread.id === selectedThreadId;
                  const isPinned = pinnedThreadIds.includes(thread.id);
                  const initial = thread.name.charAt(0).toUpperCase();
                  return (
                    <button
                      key={thread.id}
                      onClick={() => handleSelectThread(thread.id)}
                      className={cn(
                        'flex w-full items-center gap-4 border-b border-white/5 px-6 py-4 text-left transition-colors',
                        isActive ? 'bg-white/10' : 'hover:bg-white/5',
                        isPinned && !isActive && 'bg-white/5',
                      )}
                    >
                      <Avatar className="h-11 w-11 bg-white text-black shadow-lg">
                        <AvatarImage src={normalizeImageUrl(thread.avatarUrl)} alt={thread.name} />
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
              <div className="flex items-center gap-3">
                {selectedThread ? (
                  <Avatar className="h-10 w-10 bg-white text-black shadow-lg">
                    <AvatarImage src={normalizeImageUrl(selectedThread.avatarUrl)} alt={selectedThread.name} />
                    <AvatarFallback className="bg-white text-black">
                      {selectedThread.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : null}
                <span>{selectedThread ? selectedThread.name : 'select a contact'}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!selectedThread}>
                  <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-64 border border-white/10 bg-black/85 p-3 text-white shadow-xl"
                >
                  {selectedThread ? (
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11 bg-white text-black shadow-lg">
                        <AvatarImage src={normalizeImageUrl(selectedThread.avatarUrl)} alt={selectedThread.name} />
                        <AvatarFallback className="bg-white text-black">
                          {selectedThread.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">{selectedThread.name}</div>
                        <div className="text-xs text-white/60">{selectedHandle}</div>
                        <div className="mt-2 text-xs text-white/70">
                          Last active: <span className="text-white/90">{selectedLastActivity}</span>
                        </div>
                        <div className="mt-1 text-xs text-white/70">
                          Recent: <span className="text-white/90">{selectedThread.lastMessage}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-white/70">Select a contact to view details.</div>
                  )}
                  <DropdownMenuSeparator className="my-3 bg-white/10" />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setShowSearchHistory((prev) => !prev);
                    }}
                    className="cursor-pointer text-sm text-white/80 focus:bg-white/10 focus:text-white"
                    disabled={!selectedThread}
                  >
                    Search history
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={handleToggleMute}
                    className="cursor-pointer text-sm text-white/80 focus:bg-white/10 focus:text-white"
                    disabled={!selectedThread}
                  >
                    {isMuted ? 'Unmute notifications' : 'Mute notifications'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={handleTogglePin}
                    className="cursor-pointer text-sm text-white/80 focus:bg-white/10 focus:text-white"
                    disabled={!selectedThread}
                  >
                    {isPinned ? 'Unpin from top' : 'Stick on top'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-3 bg-white/10" />
                  <DropdownMenuItem
                    className="cursor-pointer text-sm text-red-300 focus:bg-red-500/15 focus:text-red-200"
                    disabled={!selectedThread}
                  >
                    Block user
                  </DropdownMenuItem>
                  {showSearchHistory ? (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-white/80">
                      <div className="text-xs font-semibold tracking-[0.12em] text-white/60">SEARCH IN CHAT</div>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              handleSearchInThread();
                            }
                          }}
                          placeholder="Type to search..."
                          className="h-9 rounded-lg border-white/20 bg-white/5 text-xs text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleSearchInThread}
                          className="h-9 border-white/20 bg-white/5 text-xs text-white hover:bg-white/10"
                        >
                          Search
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                        <span>
                          {searchMatches.length > 0
                            ? `${currentMatchIndex + 1} / ${searchMatches.length} matches`
                            : 'No matches'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={handlePreviousMatch}
                            disabled={searchMatches.length < 2}
                            className="h-7 w-7 text-white/70 hover:text-white"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={handleNextMatch}
                            disabled={searchMatches.length < 2}
                            className="h-7 w-7 text-white/70 hover:text-white"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div ref={messageListRef} className="flex-1 space-y-4 overflow-y-auto bg-black/25 px-8 py-6">
              {selectedThread && selectedThread.messages.length > 0 ? (
                selectedThread.messages.map((message, index) => {
                  const isMe = message.sender === 'me';
                  const isMatch = searchMatches.includes(index);
                  const isActiveMatch = isMatch && searchMatches[currentMatchIndex] === index;
                  const messageStatus = message.status ?? (isMe ? 'sent' : 'read');
                  const statusIcon =
                    messageStatus === 'read' ? (
                      <CheckCheck className="h-3.5 w-3.5" />
                    ) : messageStatus === 'pending' ? (
                      <Clock className="h-3.5 w-3.5" />
                    ) : messageStatus === 'blocked' ? (
                      <Ban className="h-3.5 w-3.5" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    );

                  if (
                    (message.messageKind === 'payment_request_unconfirmed' ||
                      message.messageType === 'payment_request') &&
                    message.paymentRequestData
                  ) {
                    const request = message.paymentRequestData;
                    const expiresAt = request.expires_at ? new Date(request.expires_at) : null;
                    const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;
                    const statusLabel =
                      isExpired ? 'expired' : request.status || 'pending';
                    const canConfirm =
                      !isMe && !isExpired && (statusLabel === 'pending' || statusLabel === 'created');

                    const content = (
                      <div
                        className={cn(
                          'w-full rounded-2xl border p-3 shadow-lg',
                          isMe
                            ? 'border-slate-500/40 bg-gradient-to-br from-slate-500/15 to-slate-700/10'
                            : 'border-sky-400/40 bg-gradient-to-br from-sky-500/15 to-indigo-500/10',
                          isMatch && 'border-amber-300/50 bg-amber-400/10',
                          isActiveMatch && 'border-amber-300 bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.35)]',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', isMe ? 'bg-slate-500/20' : 'bg-sky-500/20')}>
                            <DollarSign className={cn('h-4 w-4', isMe ? 'text-slate-200' : 'text-sky-200')} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn('text-xs font-semibold', isMe ? 'text-slate-200' : 'text-sky-200')}>
                                {isMe ? 'Payment request sent' : 'Payment request'}
                              </span>
                              <Badge
                                className={cn(
                                  'border-0 text-[9px] uppercase tracking-[0.15em]',
                                  statusLabel === 'paid'
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : statusLabel === 'expired'
                                      ? 'bg-red-500/20 text-red-200'
                                      : 'bg-white/10 text-white/80',
                                )}
                              >
                                {statusLabel}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xl font-bold text-white">
                              {formatCurrency(request.amount, request.currency)}
                            </div>
                            {request.product_title ? (
                              <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[11px] text-white/80">
                                {request.product_title}
                              </div>
                            ) : null}
                            {message.text ? <div className="mt-2 text-[11px] text-white/70">"{message.text}"</div> : null}
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
                              <span>{message.time}</span>
                              {expiresAt ? (
                                <>
                                  <span>•</span>
                                  <span>Expires {expiresAt.toLocaleString()}</span>
                                </>
                              ) : null}
                            </div>
                            {!isMe ? (
                              <div className="mt-2 text-[11px] text-white/70">
                                {canConfirm ? 'Tap to confirm payment' : 'Payment request status updated'}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );

                    return (
                      <div
                        key={message.id}
                        ref={(node) => {
                          messageRefs.current[message.id] = node;
                        }}
                        className={cn('flex w-full max-w-[72%] flex-col gap-2 py-2', isMe ? 'ml-auto items-end' : 'items-start')}
                      >
                        {isMe ? (
                          content
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePaymentRequest(request);
                              setShowPaymentConfirmDialog(true);
                            }}
                            className="w-full text-left"
                          >
                            {content}
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (
                    (message.messageKind === 'payment_request_confirmed' || message.messageType === 'payment_confirmation') &&
                    message.paymentRequestData
                  ) {
                    const confirmation = message.paymentRequestData;

                    return (
                      <div
                        key={message.id}
                        ref={(node) => {
                          messageRefs.current[message.id] = node;
                        }}
                        className={cn('flex w-full max-w-[72%] flex-col gap-2 py-2', isMe ? 'ml-auto items-end' : 'items-start')}
                      >
                        <div
                          className={cn(
                            'w-full rounded-2xl border p-3 shadow-lg',
                            isMe
                              ? 'border-violet-400/40 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10'
                              : 'border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/15 to-violet-500/10',
                            isMatch && 'border-amber-300/50 bg-amber-400/10',
                            isActiveMatch && 'border-amber-300 bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.35)]',
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', isMe ? 'bg-violet-500/20' : 'bg-fuchsia-500/20')}>
                              <CheckCheck className={cn('h-4 w-4', isMe ? 'text-violet-200' : 'text-fuchsia-200')} />
                            </div>
                            <div className="flex-1">
                              <div className={cn('text-xs font-semibold', isMe ? 'text-violet-200' : 'text-fuchsia-200')}>
                                Payment confirmed
                              </div>
                              <div className="mt-1 text-xl font-bold text-white">
                                {formatCurrency(confirmation.amount, confirmation.currency)}
                              </div>
                              {confirmation.product_title ? (
                                <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[11px] text-white/80">
                                  {confirmation.product_title}
                                </div>
                              ) : null}
                              <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
                                <span>{message.time}</span>
                                <span>•</span>
                                <span className="capitalize">{confirmation.status || 'paid'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Render transfer message differently
                  if (message.messageKind === 'transfer' && message.transferData) {
                    const { amount, currency, reference, sender_username } = message.transferData;
                    const isSender = isMe;
                    
                    return (
                      <div
                        key={message.id}
                        ref={(node) => {
                          messageRefs.current[message.id] = node;
                        }}
                        className={cn('flex w-full max-w-[72%] flex-col gap-2 py-2', isMe ? 'ml-auto items-end' : 'items-start')}
                      >
                        <div
                          className={cn(
                            'w-full rounded-2xl border p-3 shadow-lg',
                            isMe 
                              ? 'border-cyan-400/40 bg-gradient-to-br from-cyan-500/15 to-blue-500/10' 
                              : 'border-blue-400/40 bg-gradient-to-br from-blue-500/15 to-cyan-500/10',
                            isMatch && 'border-amber-300/50 bg-amber-400/10',
                            isActiveMatch && 'border-amber-300 bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.35)]',
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', isMe ? 'bg-cyan-500/20' : 'bg-blue-500/20')}>
                              <ArrowRightLeft className={cn('h-4 w-4', isMe ? 'text-cyan-200' : 'text-blue-200')} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={cn('text-xs font-semibold', isMe ? 'text-cyan-200' : 'text-blue-200')}>
                                  {isSender ? 'You sent' : `${sender_username || 'User'} sent`}
                                </span>
                              </div>
                              <div className="mt-1 text-xl font-bold text-white">
                                {formatCurrency(amount, currency)}
                              </div>
                              {reference ? (
                                <div className="mt-1 text-[11px] text-white/70 italic">"{reference}"</div>
                              ) : null}
                              <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
                                <span>{message.time}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  {statusIcon}
                                  <span className="capitalize">{messageStatus}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Regular message rendering
                  return (
                    <div
                      key={message.id}
                      ref={(node) => {
                        messageRefs.current[message.id] = node;
                      }}
                      className={cn('flex w-fit max-w-[68%] flex-col gap-2', isMe ? 'ml-auto items-end' : 'items-start')}
                    >
                      <div
                        className={cn(
                          'rounded-[22px] border border-white/10 px-5 py-3 text-sm leading-relaxed shadow-lg',
                          isMe ? 'bg-white/5 text-white rounded-br-md' : 'bg-black/40 text-white/90 rounded-bl-md',
                          isMatch && 'border-amber-300/50 bg-amber-400/10',
                          isActiveMatch && 'border-amber-300 bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.35)]',
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
                      <div className={cn('flex w-full items-center justify-between px-2 text-[11px]', isMe ? 'flex-row-reverse' : 'flex-row')}>
                        <span className="text-white/60">{message.time}</span>
                        <span className="text-white/40" title={messageStatus}>
                          {statusIcon}
                        </span>
                      </div>
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
                  <div className="absolute bottom-14 left-0 z-20 w-[220px] rounded-2xl border border-white/10 bg-black/60 py-2 shadow-2xl backdrop-blur-xl">
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
                    <button
                      type="button"
                      onClick={() => {
                        setShowTransferDialog(true);
                        setAttachOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-5 py-3 text-sm text-white/90 hover:bg-white/5"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                      Transfer money
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenPaymentRequest();
                        setAttachOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-5 py-3 text-sm text-white/90 hover:bg-white/5"
                    >
                      <DollarSign className="h-4 w-4" />
                      Request payment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMeetingDialog(true);
                        setAttachOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-5 py-3 text-sm text-white/90 hover:bg-white/5"
                    >
                      <MapPin className="h-4 w-4" />
                      Set meeting
                    </button>
                  </div>
                ) : null}
              </div>

              <Input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder="type a message..."
                maxLength={2000}
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

        {/* Transfer Dialog */}
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent className="bg-background sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>Transfer Money</DialogTitle>
              <DialogDescription>
                Send money to {selectedThread?.name || 'this user'}. The amount will be transferred from your wallet to theirs.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="transfer-amount">Amount</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transfer-currency">Currency</Label>
                <Select value={transferCurrency} onValueChange={setTransferCurrency}>
                  <SelectTrigger className="w-full" id="transfer-currency">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transfer-reference">Reference (optional)</Label>
                <Input
                  id="transfer-reference"
                  type="text"
                  maxLength={255}
                  placeholder="Payment for books"
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowTransferDialog(false);
                  setTransferAmount('');
                  setTransferCurrency('CNY');
                  setTransferReference('');
                }}
                disabled={isTransferring}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleTransfer}
                disabled={isTransferring || !transferAmount || !transferCurrency}
              >
                {isTransferring ? 'Transferring...' : 'Transfer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPaymentRequestDialog} onOpenChange={setShowPaymentRequestDialog}>
          <DialogContent className="bg-background sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>Request Payment</DialogTitle>
              <DialogDescription>
                Request payment from {selectedThread?.name || 'this user'} for one of your listings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Product</Label>
                <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                  {isLoadingProducts ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                      Loading your products...
                    </div>
                  ) : myProducts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/70">
                      No products available for payment requests.
                    </div>
                  ) : (
                    myProducts.map((product) => {
                      const isSelected = paymentRequestProductId === product.id;
                      const imageUrl = normalizeImageUrl(product.image_thumbnail_url) || '/placeholder.svg';
                      return (
                        <label
                          key={product.id}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition',
                            isSelected ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-white/10 bg-white/5',
                          )}
                        >
                          <input
                            type="radio"
                            name="payment-request-product"
                            checked={isSelected}
                            onChange={() => setPaymentRequestProductId(product.id)}
                            className="h-4 w-4 accent-emerald-500"
                          />
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-lg bg-white/5">
                              <img src={imageUrl} alt={product.title} className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{product.title}</div>
                              <div className="text-xs text-white/60">
                                {formatCurrency(product.price, product.currency || paymentRequestCurrency)}
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment-request-amount">Amount</Label>
                <Input
                  id="payment-request-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={paymentRequestAmount}
                  onChange={(e) => setPaymentRequestAmount(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment-request-currency">Currency</Label>
                <Select value={paymentRequestCurrency} onValueChange={setPaymentRequestCurrency}>
                  <SelectTrigger className="w-full" id="payment-request-currency">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment-request-message">Message (optional)</Label>
                <Textarea
                  id="payment-request-message"
                  maxLength={1000}
                  placeholder="Add a note for this request"
                  value={paymentRequestMessage}
                  onChange={(e) => setPaymentRequestMessage(e.target.value)}
                  className="min-h-[90px] w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment-request-expires">Expires in hours (1-720)</Label>
                <Input
                  id="payment-request-expires"
                  type="number"
                  min="1"
                  max="720"
                  placeholder="24"
                  value={paymentRequestExpiresIn}
                  onChange={(e) => setPaymentRequestExpiresIn(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPaymentRequestDialog(false);
                  setPaymentRequestAmount('');
                  setPaymentRequestCurrency('CNY');
                  setPaymentRequestMessage('');
                  setPaymentRequestExpiresIn('24');
                }}
                disabled={isPaymentRequesting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePaymentRequest}
                disabled={isPaymentRequesting || !paymentRequestAmount || !paymentRequestCurrency}
              >
                {isPaymentRequesting ? 'Requesting...' : 'Request Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showPaymentConfirmDialog}
          onOpenChange={(open) => {
            setShowPaymentConfirmDialog(open);
            if (!open) setActivePaymentRequest(null);
          }}
        >
          <DialogContent className="bg-background sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
              <DialogDescription>
                Review the payment request details before confirming.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white/90">Amount</div>
                <div className="mt-1 text-2xl font-bold text-white">
                  {activePaymentRequest ? formatCurrency(activePaymentRequest.amount, activePaymentRequest.currency) : '—'}
                </div>
                {activePaymentRequest?.product_title ? (
                  <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                    {activePaymentRequest.product_title}
                  </div>
                ) : null}
                {activePaymentRequest?.reference ? (
                  <div className="mt-2 text-xs text-white/70">Reference: {activePaymentRequest.reference}</div>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
                  <Badge className="border-0 bg-white/10 text-white/80">
                    {paymentConfirmStatus}
                  </Badge>
                  {paymentConfirmExpiresAt ? (
                    <span>Expires {paymentConfirmExpiresAt.toLocaleString()}</span>
                  ) : null}
                </div>
              </div>
              {paymentConfirmExpired ? (
                <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                  This payment request has expired.
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPaymentConfirmDialog(false);
                  setActivePaymentRequest(null);
                }}
                disabled={isConfirmingPayment}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleConfirmPaymentRequest}
                disabled={!canConfirmPayment || isConfirmingPayment}
              >
                {isConfirmingPayment ? 'Confirming...' : 'Confirm Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
          <DialogContent className="bg-background sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>Set Meeting</DialogTitle>
              <DialogDescription>
                Propose a meeting location and time for {selectedThread?.name || 'this user'}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="meeting-location">Location</Label>
                <Input
                  id="meeting-location"
                  placeholder="Library entrance, Building A"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="meeting-date">Date</Label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="meeting-time">Time</Label>
                <Input
                  id="meeting-time"
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="meeting-note">Note (optional)</Label>
                <Textarea
                  id="meeting-note"
                  maxLength={300}
                  placeholder="Add any details"
                  value={meetingNote}
                  onChange={(e) => setMeetingNote(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowMeetingDialog(false);
                  setMeetingLocation('');
                  setMeetingDate('');
                  setMeetingTime('');
                  setMeetingNote('');
                }}
                disabled={isSendingMeeting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleMeetingRequest}
                disabled={isSendingMeeting || !meetingLocation.trim() || !meetingDate || !meetingTime}
              >
                {isSendingMeeting ? 'Sending...' : 'Send Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default MessagesPage;
