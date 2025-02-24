import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgcoreModule, SettingsMatThemeService } from 'ngcore';
import { NgcommonModule } from '../../../../shared/ngcommon/src/lib/ngcommon.module';

@Component({
    selector: 'app-element-panel',
    imports: [CommonModule, FormsModule, MatButtonModule, MatCheckboxModule, NgcoreModule, NgcommonModule],
    templateUrl: './element-panel.component.html',
    styleUrl: './element-panel.component.css'
})

export class AppElementPanelComponent {
    isChecked = true;
    materialSysValues = {
        'sys-color': {},
        'sys-typescale': {},
    };
    objectKeys = Object.keys;
    sysVariables: any = [];

    constructor(private service: SettingsMatThemeService) {
	this.sysVariables = service.getSysVariables();
    }

    getStyle(category: string, key: string) {
        if (category === 'sys-color') {
	    let sysVariable = this.service.getSysVariableByName(key);
	    if (sysVariable === undefined) {
		let style = { 'background-color': 'N/A' };
		return style;
	    }
	    let color = sysVariable.value;
	    let style = { 'background-color': color };
	    return style;
        } else if (category === 'sys-typescale') {
            return { 'font': this.materialSysValues[category] };
        }
        return {};
    }

    onButtonClick(event: any) {
    }
}
