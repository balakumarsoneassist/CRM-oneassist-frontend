import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService, Theme } from '../services/theme.service';
import { ClickOutsideDirective } from '../connectors/click-outside.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ClickOutsideDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  expandedSections = {
    masters: false,
    employee: false,
    salesvisit: false,
    contacts: false,
    leads: false,
    customers: false,
    reports: false,
    segregation: false,
    performance: false,
    connector: false,
    tools: false
  };

  // Theme selector state
  showThemeSelector = false;
  availableThemes: Theme[] = [];
  currentTheme: Theme;

  // Check if user has admin rights
  get isAdminUser(): boolean {
    const adminRights = localStorage.getItem('isadminrights');
    // console.log(adminRights);
    return adminRights === 'true';
  }

  // Get username from localStorage
  get username(): string {
    return localStorage.getItem('username') || 'User';
  }

  constructor(
    private auth: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {
    this.availableThemes = this.themeService.themes;
    this.currentTheme = this.themeService.getCurrentTheme();

    // Subscribe to theme changes
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  openSettings(): void {
    alert('Settings clicked');
  }

  openProfile(): void {
    this.router.navigate(['/dashboard/profile']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleSection(section: keyof typeof this.expandedSections): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  // Theme selector methods
  toggleThemeSelector(): void {
    this.showThemeSelector = !this.showThemeSelector;
  }

  selectTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
    this.showThemeSelector = false;
  }

  closeThemeSelector(): void {
    this.showThemeSelector = false;
  }
}
