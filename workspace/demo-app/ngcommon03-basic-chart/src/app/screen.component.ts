import { Component } from '@angular/core';

import { NgcoreModule } from 'ngcore';
import { NgcommonModule, BasicChartComponent, ChartOptionsContainerComponent } from 'ngcommon';

@Component({
    selector: 'app-screen',
    imports: [NgcoreModule, NgcommonModule, BasicChartComponent, ChartOptionsContainerComponent],
    templateUrl: './screen.component.html'
})

export class AppScreenComponent {}
