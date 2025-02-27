import { Component } from '@angular/core';

import { NgcoreModule } from 'ngcore';
import { NgcommonModule, BasicChartComponent } from 'ngcommon';

@Component({
  selector: 'app-screen',
  imports: [NgcoreModule, NgcommonModule, BasicChartComponent],
  templateUrl: './screen.component.html'
})

export class AppScreenComponent {}
