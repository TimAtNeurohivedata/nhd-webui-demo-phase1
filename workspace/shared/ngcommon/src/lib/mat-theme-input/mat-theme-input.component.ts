import { Component } from '@angular/core';

import { SettingsMatThemeService, SettingsMatThemeType } from 'ngcore';

@Component({
    selector: 'nhd-ngcommon-mat-theme-input',
    standalone: false,
    templateUrl: './mat-theme-input.component.html',
    styleUrl: './mat-theme-input.component.css'
})

export class MatThemeInputComponent {
    constructor(public themeService: SettingsMatThemeService) {}

    changeTheme(theme: string): void {
	this.themeService.setThemeName(theme);
    }
}
