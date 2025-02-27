// import { Subscription } from 'rxjs';
import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule} from '@angular/material/select';

import { ChartOptionsDataGeneratorType, ChartOptionsService, ChartOptionsType } from './chart-options.service';

@Component({
    selector: 'nhd-ngcommon-chart-options-container',
    imports: [FormsModule, MatCheckboxModule, MatFormFieldModule, MatSelectModule],
    standalone: true,

    templateUrl: './chart-options.component.html',
    styleUrl: '../mat-theme-input/mat-theme-input.component.css'
})

export class ChartOptionsContainerComponent {
    inputValue: string = "";
    optionsService: ChartOptionsService;

    constructor(private _optionsService: ChartOptionsService) {
	this.optionsService = _optionsService;
    }

    ngModelChange(partialChartOptions: any) {
	let dataTypePartial: Partial<ChartOptionsType> = { dataGenerator: { dataType: ("SineWave" as string) } } as Partial<ChartOptionsType>; // Just an example for future reference
	this._optionsService.chartOptionsPartialUpdate(partialChartOptions);
    }
}
