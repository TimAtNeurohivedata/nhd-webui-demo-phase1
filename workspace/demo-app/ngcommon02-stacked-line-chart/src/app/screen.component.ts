import { Component } from '@angular/core';

import { NgcoreModule } from 'ngcore';
import { NgcommonModule, ChartOptionsContainerComponent, ChartOptionsService, ChartThemeService, StackedLineChartComponent, OverviewChartComponent } from 'ngcommon';

@Component({
    selector: 'app-screen',
    imports: [NgcoreModule, NgcommonModule, ChartOptionsContainerComponent, StackedLineChartComponent, OverviewChartComponent],
    templateUrl: './screen.component.html'
})

export class AppScreenComponent {
    constructor(private _optionsService: ChartOptionsService, private _themeService: ChartThemeService) {
	this._optionsService.chartOptions.dataGenerator.dataType = "EegFixedData";
	this._optionsService.chartOptions.dataGenerator.autoUpdateType = "Stream";
    }
}
