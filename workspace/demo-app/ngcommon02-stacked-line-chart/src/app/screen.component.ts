import { Component } from '@angular/core';

import { NgcoreModule } from 'ngcore';
import { NgcommonModule, ChartOptionsContainerComponent, StackedLineChartComponent } from 'ngcommon';

@Component({
    selector: 'app-screen',
    imports: [NgcoreModule, NgcommonModule, ChartOptionsContainerComponent, StackedLineChartComponent],
    templateUrl: './screen.component.html'
})

export class AppScreenComponent {}
