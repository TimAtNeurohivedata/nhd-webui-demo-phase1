import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

type SettingsThemeType = { name: string, displayName: string, color: string, backgroundColor: string };

@Injectable({
  providedIn: 'root'
})

export class SettingsThemeService {
  public themeList: SettingsThemeType[] = [
    { name: 'azure-blue', displayName: 'azure-blue', color: '#d7e3ff', backgroundColor: '#fdfbff' },
    { name: 'cyan-orange', displayName: 'cyan-orange', color: '#004f4f', backgroundColor: '#191c1c' },
    { name: 'magenta-violet', displayName: 'magenta-violet', color: '#810081', backgroundColor: '#1e1a1d' },
    { name: 'rose-red', displayName: 'rose-red', color: '#ffd9e1', backgroundColor: '#fffbff' },

    { name: 'search-ai-dark', displayName: 'search-ai-dark', color: 'rgb(31, 45, 65)', backgroundColor: '#101218' },
  ];
  public currentTheme: SettingsThemeType = this.themeList[1];

  private renderer: Renderer2;
  private currentThemeName: string = 'cyan-orange'; // Default theme

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.setTheme(this.currentThemeName)
  }

  setTheme(themeName: string): void {
     const body = document.querySelector('body');
     if (body) {
        this.renderer.removeClass(body, this.currentThemeName + '-theme');
        this.renderer.addClass(body, themeName + '-theme');
     }
     this.currentThemeName = themeName;
  }

  getTheme(): string {
    return this.currentThemeName
  }
}

import { Component } from '@angular/core';

@Component({
  selector: 'nhd-ngcommon-mat-theme-input',
  standalone: false,
  templateUrl: './mat-theme-input.component.html',
  styleUrl: './mat-theme-input.component.css'
})

export class MatThemeInputComponent {
  constructor(public themeService: SettingsThemeService) {}

  changeTheme(theme: string): void {
    this.themeService.setTheme(theme);
  }
}
