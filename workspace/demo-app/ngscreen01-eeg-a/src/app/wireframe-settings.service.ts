import { Component } from '@angular/core';
import { Injectable } from '@angular/core';
import { Subject } from "rxjs";

export type WireframeSettingsType = {
    displayBackground: boolean;
    displayBorder: boolean;
    displayTitle: boolean;

    enableLevelRv: boolean;
    enableLevel1: boolean;
    enableLevel2: boolean;
    enableLevel3: boolean;
    enableLevel4: boolean;
}

export let
WireframeSettingsDefaults: WireframeSettingsType = {
    displayBackground: true,
    displayBorder: true,
    displayTitle: true,

    enableLevelRv: false,
    enableLevel1: false,
    enableLevel2: false,
    enableLevel3: false,
    enableLevel4: false,
}

@Injectable(
  // Declare that this service should be created by any injector
  // that includes OasisServiceModule
  // This option is new to Angular 6
  // providedIn: 'OasisServiceModule'
  {
   providedIn: 'root',
  }
)

export class OasisWireframeSettingsService {
    private _updateCallback!: () => void;
    private _updateSubject!: Subject<void>;
    private _wireframeSettings!: WireframeSettingsType;

    constructor() {
	this._initUpdateSubject();
	this._initWireframeSettings();
	this._updateWireframeStyles();
    }

    private _initUpdateSubject(): void {
	this._updateSubject = new Subject<void>();
    }

    private _initWireframeSettings(): void {
	this._wireframeSettings = WireframeSettingsDefaults;
    }

    _updateWireframeStyles(): void {
	let rootElement = document.documentElement;

	if (this._wireframeSettings.enableLevel1) {
	    console.log("enable oasis-wireframe1 class");
	    rootElement.classList.add('oasis-wireframe1');
	}
	else {
	    console.log("disable oasis-wireframe1 class");
	    rootElement.classList.remove('oasis-wireframe1');
	}
	if (this._wireframeSettings.enableLevel2) {
	    console.log("enable oasis-wireframe2 class");
	    rootElement.classList.add('oasis-wireframe2');
	}
	else {
	    console.log("disable oasis-wireframe2 class");
	    rootElement.classList.remove('oasis-wireframe2');
	}
	if (this._wireframeSettings.enableLevel3) {
	    console.log("enable oasis-wireframe3 class");
	    rootElement.classList.add('oasis-wireframe3');
	}
	else {
	    console.log("disable oasis-wireframe3 class");
	    rootElement.classList.remove('oasis-wireframe3');
	}
	if (this._wireframeSettings.enableLevel4) {
	    console.log("enable oasis-wireframe4 class");
	    rootElement.classList.add('oasis-wireframe4');
	}
	else {
	    console.log("disable oasis-wireframe4 class");
	    rootElement.classList.remove('oasis-wireframe4');
	}
    }

    getWireframeSettings(): WireframeSettingsType {
	return this._wireframeSettings;
    }

    setWireframeSettings(settings: WireframeSettingsType): void {
	this._wireframeSettings = settings;
	this._updateWireframeStyles();
    }

    registerUpdateCallback(callback: () => void): void {
	this._updateSubject.subscribe(
	    () => callback()
	);
    }
}
