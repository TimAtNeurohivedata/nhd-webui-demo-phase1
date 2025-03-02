import { Component } from '@angular/core';

import { NgcoreModule } from 'ngcore';
import { NgcommonModule, ChartOptionsContainerComponent, StackedLineChartComponent, OverviewChartComponent } from 'ngcommon';

@Component({
    selector: 'app-screen',
    imports: [NgcoreModule, NgcommonModule, ChartOptionsContainerComponent, StackedLineChartComponent, OverviewChartComponent],
    templateUrl: './screen.component.html'
})

export class AppScreenComponent {}
