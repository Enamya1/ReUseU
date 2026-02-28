import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Github, Instagram, Twitter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
  const location = useLocation();
  const [isRightPanelActive, setIsRightPanelActive] = useState(location.pathname === '/signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    setIsRightPanelActive(location.pathname === '/signup');
  }, [location.pathname]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: t('login.missingFields'),
        description: t('login.missingFields'),
        variant: "destructive",
      });
      return;
    }

    setIsLoginLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: t('login.welcomeBack'),
          description: t('login.subtitle'),
        });
        navigate('/');
      } else {
        toast({
          title: t('login.loginFailed'),
          description: t('login.loginFailed'),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t('login.error'),
        description: t('login.error'),
        variant: "destructive",
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleSignupChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.username || !formData.email || !formData.password) {
      toast({
        title: t('signup.missingFields'),
        description: t('signup.missingFields'),
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('signup.passwordMismatch'),
        description: t('signup.passwordMismatch'),
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: t('signup.passwordTooShort'),
        description: t('signup.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }

    setIsSignupLoading(true);

    try {
      const response = await signup({
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (response?.user || response?.message) {
        toast({
          title: t('signup.title'),
          description: response.message || t('signup.success'),
        });
        setIsRightPanelActive(false);
        navigate('/login');
        return;
      }

      toast({
        title: t('signup.error'),
        description: t('signup.error'),
        variant: "destructive",
      });
    } catch (error) {
      const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
      toast({
        title: maybe?.message || t('signup.error'),
        description: maybe?.message || t('signup.error'),
        variant: "destructive",
      });
    } finally {
      setIsSignupLoading(false);
    }
  };

  const inputClass = "h-[54px] rounded-xl border-0 bg-[#f3f3f3] px-5 text-base text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:border-2 focus-visible:border-black focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.15)]";
  const socialClass = "h-14 w-14 rounded-xl bg-[#f0f0f0] text-zinc-800 flex items-center justify-center transition-all duration-300 hover:bg-black hover:text-white hover:scale-105 shadow-[0_2px_6px_rgba(0,0,0,0.05)]";
  const actionButtonClass = "h-[54px] w-[220px] rounded-full bg-black text-white text-lg font-semibold tracking-wide shadow-[0_8px_16px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105 hover:bg-zinc-900 disabled:opacity-60 disabled:cursor-not-allowed";
  const outlineButtonClass = "h-[54px] w-[220px] rounded-full border-2 border-white text-white text-lg font-semibold tracking-wide transition-all duration-300 hover:bg-white hover:text-black hover:scale-105";

  return (
    <div className="auth-root">
      <div className={cn("auth-shell", isRightPanelActive && "auth-right-active")}>
        <div className="auth-form-container auth-sign-in">
          <div className="w-full max-w-md">
            <h1 className="text-[2.6rem] font-bold text-zinc-900">{t('common.login')}</h1>
            <div className="mt-6 flex justify-center gap-5">
              <button type="button" className={socialClass} aria-label="Twitter">
                <Twitter className="h-6 w-6" />
              </button>
              <button type="button" className={socialClass} aria-label="Instagram">
                <Instagram className="h-6 w-6" />
              </button>
              <button type="button" className={socialClass} aria-label="GitHub">
                <Github className="h-6 w-6" />
              </button>
            </div>
            <span className="mt-4 block text-base font-medium text-zinc-500">
              {t('login.subtitle')}
            </span>
            <form onSubmit={handleLoginSubmit} className="mt-6 w-full space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="email" className="sr-only">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('login.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Label htmlFor="password" className="sr-only">{t('login.password')}</Label>
                  <Input
                    id="password"
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder={t('login.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(inputClass, "pr-12")}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="text-right text-sm">
                  <Link to="/forgot-password" className="text-zinc-500 hover:text-black transition-colors">
                    {t('login.forgotPassword')}
                  </Link>
                </div>
              </div>
              <div className="pt-2 text-center">
                <button type="submit" className={actionButtonClass} disabled={isLoginLoading}>
                  {isLoginLoading ? t('login.submitting') : t('login.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="auth-form-container auth-sign-up">
          <div className="w-full max-w-md">
            <h1 className="text-[2.6rem] font-bold text-zinc-900">{t('common.signup')}</h1>
            <div className="mt-6 flex justify-center gap-5">
              <button type="button" className={socialClass} aria-label="Twitter">
                <Twitter className="h-6 w-6" />
              </button>
              <button type="button" className={socialClass} aria-label="Instagram">
                <Instagram className="h-6 w-6" />
              </button>
              <button type="button" className={socialClass} aria-label="GitHub">
                <Github className="h-6 w-6" />
              </button>
            </div>
            <span className="mt-4 block text-base font-medium text-zinc-500">
              {t('signup.subtitle')}
            </span>
            <form onSubmit={handleSignupSubmit} className="mt-6 w-full space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="sr-only">{t('signup.fullName')}</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder={t('signup.fullName')}
                  value={formData.full_name}
                  onChange={(e) => handleSignupChange('full_name', e.target.value)}
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="sr-only">{t('signup.username')}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={t('signup.username')}
                  value={formData.username}
                  onChange={(e) => handleSignupChange('username', e.target.value)}
                  className={inputClass}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup_email" className="sr-only">{t('signup.email')}</Label>
                <Input
                  id="signup_email"
                  type="email"
                  placeholder={t('signup.email')}
                  value={formData.email}
                  onChange={(e) => handleSignupChange('email', e.target.value)}
                  className={inputClass}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Label htmlFor="signup_password" className="sr-only">{t('signup.password')}</Label>
                  <Input
                    id="signup_password"
                    type={showSignupPassword ? 'text' : 'password'}
                    placeholder={t('signup.password')}
                    value={formData.password}
                    onChange={(e) => handleSignupChange('password', e.target.value)}
                    className={cn(inputClass, "pr-12")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    {showSignupPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="sr-only">{t('signup.confirmPassword')}</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder={t('signup.confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={(e) => handleSignupChange('confirmPassword', e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <div className="pt-2 text-center">
                <button type="submit" className={actionButtonClass} disabled={isSignupLoading}>
                  {isSignupLoading ? t('signup.submitting') : t('signup.submit')}
                </button>
              </div>
            </form>
            <p className="mt-4 text-center text-xs text-zinc-500">
              {t('signup.termsPrefix')}{' '}
              <Link to="/terms" className="text-zinc-800 hover:text-black transition-colors">
                {t('signup.terms')}
              </Link>
              {' '}{t('common.and', { defaultValue: 'and' })}{' '}
              <Link to="/privacy" className="text-zinc-800 hover:text-black transition-colors">
                {t('signup.privacy')}
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-overlay-container">
          <div className="auth-overlay">
            <div className="auth-overlay-panel auth-overlay-left">
              <h2 className="text-[3rem] font-bold">{t('login.welcomeBack')}</h2>
              <p className="mt-4 text-lg text-white/90 max-w-sm">{t('login.subtitle')}</p>
              <button
                type="button"
                className={cn(outlineButtonClass, "mt-8")}
                onClick={() => setIsRightPanelActive(false)}
              >
                {t('common.login')}
              </button>
            </div>
            <div className="auth-overlay-panel auth-overlay-right">
              <h2 className="text-[3rem] font-bold">{t('signup.title')}</h2>
              <p className="mt-4 text-lg text-white/90 max-w-sm">{t('signup.subtitle')}</p>
              <button
                type="button"
                className={cn(outlineButtonClass, "mt-8")}
                onClick={() => setIsRightPanelActive(true)}
              >
                {t('common.signup')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
