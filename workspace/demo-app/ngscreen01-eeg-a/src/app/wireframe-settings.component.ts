import {
    Component,
    ElementRef,
    ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { OasisWireframeSettingsService, WireframeSettingsType } from './wireframe-settings.service';

@Component({
    selector: 'oasis-panel-wireframe-settings',
    templateUrl: './wireframe-settings.component.html',
    styleUrls: [
	'./wireframe-settings.component.css',
    ],
    imports: [CommonModule],
})

export class OasisPanelWireframeSettingsComponent {
    constructor(private _wireframeSettingsService: OasisWireframeSettingsService) {
    }

    ngAfterViewInit(): void {
	this.refresh();
    }

    enableSelectOptions: any = [
	{ value: "disabled", display: "Disabled" },
	{ value: "enabled", display: "Enabled" },
    ]

    wireframeSelectOptions2: any = [
	{ value: "enable-all", display: "Enable All" },
	{ value: "enable-background", display: "Enable Background" },
	{ value: "enable-border", display: "Enable Border" },
	{ value: "enable-text", display: "Enable Text" },
    ]

    _wireframeLevelRvSelectInputEvent(event: any): void {
	let value: string = event.target.value;
	let settings: WireframeSettingsType;

	settings = this._wireframeSettingsService.getWireframeSettings();
	if (value === "disabled") {
	    settings.enableLevelRv = false;
	}
	if (value === "enabled") {
	    settings.enableLevelRv = true;
	}
	this._wireframeSettingsService.setWireframeSettings(settings);
    }

    _wireframeLevel1SelectInputEvent(event: any): void {
	let value: string = event.target.value;
	let settings: WireframeSettingsType;

	settings = this._wireframeSettingsService.getWireframeSettings();
	if (value === "disabled") {
	    settings.enableLevel1 = false;
	}
	if (value === "enabled") {
	    settings.enableLevel1 = true;
	}
	this._wireframeSettingsService.setWireframeSettings(settings);
    }

    _wireframeLevel2SelectInputEvent(event: any): void {
	let value: string = event.target.value;
	let settings: WireframeSettingsType;

	settings = this._wireframeSettingsService.getWireframeSettings();
	if (value === "disabled") {
	    settings.enableLevel2 = false;
	}
	if (value === "enabled") {
	    settings.enableLevel2 = true;
	}
	this._wireframeSettingsService.setWireframeSettings(settings);
    }

    _wireframeLevel3SelectInputEvent(event: any): void {
	let value: string = event.target.value;
	let settings: WireframeSettingsType;

	settings = this._wireframeSettingsService.getWireframeSettings();
	if (value === "disabled") {
	    settings.enableLevel3 = false;
	}
	if (value === "enabled") {
	    settings.enableLevel3 = true;
	}
	this._wireframeSettingsService.setWireframeSettings(settings);
    }

    _wireframeLevel4SelectInputEvent(event: any): void {
	let value: string = event.target.value;
	let settings: WireframeSettingsType;

	settings = this._wireframeSettingsService.getWireframeSettings();
	if (value === "disabled") {
	    settings.enableLevel4 = false;
	}
	if (value === "enabled") {
	    settings.enableLevel4 = true;
	}
	this._wireframeSettingsService.setWireframeSettings(settings);
    }

    refresh(): void {
    }
}
