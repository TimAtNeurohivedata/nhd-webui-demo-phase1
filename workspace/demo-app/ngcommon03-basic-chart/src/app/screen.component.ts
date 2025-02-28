import { Component } from '@angular/core';

import { NgcoreModule } from 'ngcore';
import { NgcommonModule, BasicChartComponent, ChartOptionsContainerComponent, StackedLineChartComponent2 } from 'ngcommon';

@Component({
    selector: 'app-screen',
    imports: [NgcoreModule, NgcommonModule, BasicChartComponent, ChartOptionsContainerComponent],
    templateUrl: './screen.component.html'
})

export class AppScreenComponent {}
