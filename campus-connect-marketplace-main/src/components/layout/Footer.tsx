import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Github, Twitter, Instagram } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                SCU
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <nav className="space-y-2">
              <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.browseItems')}
              </Link>
              <Link to="/create-listing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.sellItem')}
              </Link>
              <Link to="/categories" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.categories')}
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.support')}</h3>
            <nav className="space-y-2">
              <Link to="/help" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.helpCenter')}
              </Link>
              <Link to="/safety" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.safetyTips')}
              </Link>
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.contactUs')}
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.legal')}</h3>
            <nav className="space-y-2">
              <Link to="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.terms')}
              </Link>
              <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.privacy')}
              </Link>
              <Link to="/guidelines" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.guidelines')}
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('footer.madeWith')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
