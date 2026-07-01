/**
 * Hook useTenantTheme
 * 
 * Gère les thèmes tenant-spécifiques (couleurs, logo, etc.)
 * Supporte Light/Dark mode avec couleurs adaptées par tenant
 * Applique automatiquement les styles CSS au DOM
 */

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getTenantModules, TenantSector } from '@/config/tenant-modules';

export interface TenantTheme {
  sector: TenantSector;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  logoPosition?: 'left' | 'center' | 'top';
  isDarkMode: boolean;
  // Variantes calculées
  lightVariant: string;  // Couleur plus claire
  darkVariant: string;   // Couleur plus foncée
  contrastText: string;  // Texte contrastant (blanc/noir)
}

export interface UseTenantThemeReturn {
  theme: TenantTheme | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  getPrimaryColor: (variant?: 'light' | 'dark' | 'base') => string;
  getSecondaryColor: (variant?: 'light' | 'dark' | 'base') => string;
  getAccentColor: (variant?: 'light' | 'dark' | 'base') => string;
  getCSSVariable: (name: string) => string;
  getLogoUrl: () => string | undefined;
}

export function useTenantTheme(): UseTenantThemeReturn {
  const { user } = useAuth();
  const [theme, setTheme] = useState<TenantTheme | null>(null);
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(() => {
    // Récupérer la préférence depuis localStorage
    const stored = localStorage.getItem('theme-dark-mode');
    if (stored !== null) {
      return stored === 'true';
    }
    // Sinon, vérifier la préférence système
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (!user?.sector) return;

    try {
      const sector = user.sector as TenantSector;
      const tenantConfig = getTenantModules(sector);
      const colors = tenantConfig.theme;

      // Calculer les variantes de couleurs
      const lightVariant = lightenColor(colors.primaryColor, 30);
      const darkVariant = darkenColor(colors.primaryColor, 30);
      const contrastText = getContrastText(colors.primaryColor);

      const calculatedTheme: TenantTheme = {
        sector,
        primaryColor: colors.primaryColor,
        secondaryColor: colors.secondaryColor,
        accentColor: colors.accentColor,
        logoUrl: colors.logoUrl,
        logoPosition: colors.logoPosition,
        isDarkMode,
        lightVariant,
        darkVariant,
        contrastText,
      };

      setTheme(calculatedTheme);

      // Appliquer les styles au DOM
      applyThemeToDOM(calculatedTheme, isDarkMode);

      // Log pour debug
      console.log(`[Theme] Applied theme for sector: ${sector}`, calculatedTheme);
    } catch (error) {
      console.error('[Theme] Error applying theme:', error);
    }
  }, [user, isDarkMode]);

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkModeState(newValue);
    localStorage.setItem('theme-dark-mode', String(newValue));
    window.dispatchEvent(new CustomEvent('themechange', { detail: { isDarkMode: newValue } }));
  };

  const setDarkMode = (isDark: boolean) => {
    setIsDarkModeState(isDark);
    localStorage.setItem('theme-dark-mode', String(isDark));
    window.dispatchEvent(new CustomEvent('themechange', { detail: { isDarkMode: isDark } }));
  };

  const getPrimaryColor = (variant?: 'light' | 'dark' | 'base'): string => {
    if (!theme) return '#0ea5e9';

    switch (variant) {
      case 'light':
        return theme.lightVariant;
      case 'dark':
        return theme.darkVariant;
      default:
        return theme.primaryColor;
    }
  };

  const getSecondaryColor = (variant?: 'light' | 'dark' | 'base'): string => {
    if (!theme) return '#06b6d4';

    if (variant === 'light') {
      return lightenColor(theme.secondaryColor, 20);
    } else if (variant === 'dark') {
      return darkenColor(theme.secondaryColor, 20);
    }
    return theme.secondaryColor;
  };

  const getAccentColor = (variant?: 'light' | 'dark' | 'base'): string => {
    if (!theme) return '#0284c7';

    if (variant === 'light') {
      return lightenColor(theme.accentColor, 20);
    } else if (variant === 'dark') {
      return darkenColor(theme.accentColor, 20);
    }
    return theme.accentColor;
  };

  const getCSSVariable = (name: string): string => {
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  };

  const getLogoUrl = (): string | undefined => {
    return theme?.logoUrl;
  };

  return {
    theme,
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    getPrimaryColor,
    getSecondaryColor,
    getAccentColor,
    getCSSVariable,
    getLogoUrl,
  };
}

/**
 * Appliquer le thème aux CSS variables du DOM
 */
function applyThemeToDOM(theme: TenantTheme, isDarkMode: boolean): void {
  const root = document.documentElement;

  // Variables de couleurs
  root.style.setProperty('--tenant-primary', theme.primaryColor);
  root.style.setProperty('--tenant-secondary', theme.secondaryColor);
  root.style.setProperty('--tenant-accent', theme.accentColor);
  root.style.setProperty('--tenant-primary-light', theme.lightVariant);
  root.style.setProperty('--tenant-primary-dark', theme.darkVariant);
  root.style.setProperty('--tenant-contrast-text', theme.contrastText);

  // Mode dark
  root.style.setProperty('--theme-dark-mode', isDarkMode ? '1' : '0');

  // Appliquer une classe pour le dark mode
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Appliquer un attribut data pour les styles
  document.documentElement.setAttribute('data-tenant-sector', theme.sector);
  document.documentElement.setAttribute('data-theme-dark', isDarkMode ? 'true' : 'false');

  // Mettre à jour Tailwind colors si besoin
  updateTailwindTheme(theme, isDarkMode);
}

/**
 * Mettre à jour les variables Tailwind dynamiquement
 */
function updateTailwindTheme(theme: TenantTheme, isDarkMode: boolean): void {
  // Créer ou mettre à jour une feuille de style dynamique
  let styleElement = document.getElementById('tenant-theme-styles');

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'tenant-theme-styles';
    document.head.appendChild(styleElement);
  }

  // Construire les règles CSS dynamiques
  const bgColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const borderColor = isDarkMode ? '#333333' : '#e5e7eb';

  const css = `
    :root {
      --primary-color: ${theme.primaryColor};
      --secondary-color: ${theme.secondaryColor};
      --accent-color: ${theme.accentColor};
      --bg-primary: ${bgColor};
      --text-primary: ${textColor};
      --border-color: ${borderColor};
    }

    /* Appliquer le thème aux composants principaux */
    .btn-primary {
      background-color: ${theme.primaryColor};
      color: ${theme.contrastText};
    }

    .btn-primary:hover {
      background-color: ${darkenColor(theme.primaryColor, 10)};
    }

    .text-tenant-primary {
      color: ${theme.primaryColor};
    }

    .bg-tenant-primary {
      background-color: ${theme.primaryColor};
    }

    .border-tenant-primary {
      border-color: ${theme.primaryColor};
    }

    /* Dark mode overrides */
    ${isDarkMode ? `
      body {
        background-color: #0f0f0f;
        color: #e5e7eb;
      }

      .dark\\:bg-tenant-primary {
        background-color: ${darkenColor(theme.primaryColor, 20)};
      }
    ` : ''}

    /* Logo positioning */
    ${theme.logoUrl ? `
      .tenant-logo {
        background-image: url('${theme.logoUrl}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: ${getLogoPosition(theme.logoPosition)};
      }
    ` : ''}
  `;

  styleElement.textContent = css;
}

/**
 * Obtenir la position du logo en CSS
 */
function getLogoPosition(position?: string): string {
  switch (position) {
    case 'center':
      return 'center';
    case 'top':
      return 'top center';
    default:
      return 'left center';
  }
}

/**
 * Éclaircir une couleur hex
 */
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return (
    '#' +
    (0x1000000 + (R < 255 ? R : 255) * 0x10000 + (G < 255 ? G : 255) * 0x100 + (B < 255 ? B : 255))
      .toString(16)
      .slice(1)
  );
}

/**
 * Assombrir une couleur hex
 */
function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return (
    '#' +
    (0x1000000 + (R > 0 ? R : 0) * 0x10000 + (G > 0 ? G : 0) * 0x100 + (B > 0 ? B : 0))
      .toString(16)
      .slice(1)
  );
}

/**
 * Déterminer la couleur de texte contrastant (blanc ou noir)
 */
function getContrastText(backgroundColor: string): string {
  const rgb = parseInt(backgroundColor.replace('#', ''), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  // Luminosité YIQ
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128 ? '#000000' : '#ffffff';
}

/**
 * Hook pour utiliser les couleurs du tenant dans les composants
 */
export function useTenantColors() {
  const { theme } = useTenantTheme();

  return {
    primary: theme?.primaryColor || '#0ea5e9',
    secondary: theme?.secondaryColor || '#06b6d4',
    accent: theme?.accentColor || '#0284c7',
    light: theme?.lightVariant || '#cffafe',
    dark: theme?.darkVariant || '#023e8a',
    textContrast: theme?.contrastText || '#ffffff',
  };
}
