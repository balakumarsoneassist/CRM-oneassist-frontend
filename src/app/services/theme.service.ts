import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface Theme {
  name: string;
  displayName: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  gradient: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'selected-theme';
  private isBrowser: boolean;
  
  // Available themes
  public readonly themes: Theme[] = [
    {
      name: 'default',
      displayName: 'Default Blue',
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#4f46e5',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      name: 'dark',
      displayName: 'Dark Mode',
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#6366f1',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#d1d5db',
      border: '#374151',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)'
    },
    {
      name: 'green',
      displayName: 'Nature Green',
      primary: '#059669',
      secondary: '#047857',
      accent: '#10b981',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#064e3b',
      textSecondary: '#6b7280',
      border: '#d1fae5',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
    },
    {
      name: 'purple',
      displayName: 'Royal Purple',
      primary: '#7c3aed',
      secondary: '#5b21b6',
      accent: '#8b5cf6',
      background: '#faf5ff',
      surface: '#ffffff',
      text: '#581c87',
      textSecondary: '#6b7280',
      border: '#e9d5ff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)'
    },
    {
      name: 'orange',
      displayName: 'Sunset Orange',
      primary: '#ea580c',
      secondary: '#c2410c',
      accent: '#f97316',
      background: '#fff7ed',
      surface: '#ffffff',
      text: '#9a3412',
      textSecondary: '#6b7280',
      border: '#fed7aa',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
    },
    {
      name: 'teal',
      displayName: 'Ocean Teal',
      primary: '#0d9488',
      secondary: '#0f766e',
      accent: '#14b8a6',
      background: '#f0fdfa',
      surface: '#ffffff',
      text: '#134e4a',
      textSecondary: '#6b7280',
      border: '#a7f3d0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'
    }
  ];

  private currentThemeSubject = new BehaviorSubject<Theme>(this.themes[0]);
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadSavedTheme();
  }

  private loadSavedTheme(): void {
    if (this.isBrowser) {
      const savedThemeName = localStorage.getItem(this.THEME_KEY);
      if (savedThemeName) {
        const savedTheme = this.themes.find(theme => theme.name === savedThemeName);
        if (savedTheme) {
          this.setTheme(savedTheme);
          return;
        }
      }
    }
    // Default theme
    this.setTheme(this.themes[0]);
  }

  public setTheme(theme: Theme): void {
    if (this.isBrowser) {
      // Apply CSS custom properties
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', theme.primary);
      root.style.setProperty('--theme-secondary', theme.secondary);
      root.style.setProperty('--theme-accent', theme.accent);
      root.style.setProperty('--theme-background', theme.background);
      root.style.setProperty('--theme-surface', theme.surface);
      root.style.setProperty('--theme-text', theme.text);
      root.style.setProperty('--theme-text-secondary', theme.textSecondary);
      root.style.setProperty('--theme-border', theme.border);
      root.style.setProperty('--theme-success', theme.success);
      root.style.setProperty('--theme-warning', theme.warning);
      root.style.setProperty('--theme-error', theme.error);
      root.style.setProperty('--theme-gradient', theme.gradient);

      // Save to localStorage
      localStorage.setItem(this.THEME_KEY, theme.name);
    }
    
    // Update current theme
    this.currentThemeSubject.next(theme);
  }

  public getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  public getThemeByName(name: string): Theme | undefined {
    return this.themes.find(theme => theme.name === name);
  }
}
