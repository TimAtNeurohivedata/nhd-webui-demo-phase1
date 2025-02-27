import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

import { SettingsMatThemeService } from 'ngcore';

export type ChartThemeVariablesType = {
    sciChartSurfaceBackgroundColor: string | undefined;
    sciChartSurfaceTextColor: string | undefined;
    sciChartAxisColor: string | undefined;
    sciChartNumericAxisColor: string | undefined;
}

export let chartThemeVariablesDefault: ChartThemeVariablesType = {
    sciChartSurfaceBackgroundColor: undefined,
    sciChartSurfaceTextColor: undefined,
    sciChartAxisColor: undefined,
    sciChartNumericAxisColor: undefined
};

@Injectable({
    providedIn: 'root'
})

export class ChartThemeService {
    private _chartThemeVariablesSubject = new Subject<void>();
    private _sysVariables: any = [];
    private _subscription: any;

    chartThemeVariables: ChartThemeVariablesType = chartThemeVariablesDefault;
    chartThemeVariables$ = this._chartThemeVariablesSubject.asObservable();

    constructor(private _matThemeService: SettingsMatThemeService) {
	this._sysVariables = this._matThemeService.getSysVariables();
	this._updateThemeVariables();
	this._subscription = this._matThemeService.themeUpdated$.subscribe(() => {
	    this._sysVariables = this._matThemeService.getSysVariables();
	    this._updateThemeVariables();
	    this._chartThemeVariablesSubject.next();
	});
    }

    private _updateThemeVariables(): void {
	this.chartThemeVariables.sciChartSurfaceBackgroundColor = lookupColorVariable(this._matThemeService, "--mat-sys-surface-container");
	this.chartThemeVariables.sciChartSurfaceTextColor = lookupColorVariable(this._matThemeService, "--mat-sys-primary");
	this.chartThemeVariables.sciChartAxisColor = lookupColorVariable(this._matThemeService, "--mat-sys-primary");
	this.chartThemeVariables.sciChartNumericAxisColor = lookupColorVariable(this._matThemeService, "--mat-sys-secondary");
    }

    updateThemeVariables(): void {
	this._updateThemeVariables();
    }
}

function convertRgbToHexIfNotHex(color: string): string | undefined {
    if (color.startsWith('#')) {
	return color; // Already in hex format, return as is
    }
    const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgbMatch) {
	const r = parseInt(rgbMatch[1], 10);
	const g = parseInt(rgbMatch[2], 10);
	const b = parseInt(rgbMatch[3], 10);

	const toHex = (c: number): string => {
	    const hex = c.toString(16);
	    return hex.length === 1 ? '0' + hex : hex;
	};
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    return undefined; // Return an error value for invalid formats
}

function lookupColorVariable(themeService: SettingsMatThemeService, sysVariableName: string): string | undefined {
    let sysVariableValue: any = themeService.getSysVariableByName(sysVariableName).value;
    if (sysVariableValue === undefined) { return undefined; }
    sysVariableValue = convertRgbToHexIfNotHex(sysVariableValue);
    return sysVariableValue;
}
