import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected title = 'wcrm';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Theme service will automatically load the saved theme or default theme
    // This ensures themes are applied immediately when the app starts
  }
}
