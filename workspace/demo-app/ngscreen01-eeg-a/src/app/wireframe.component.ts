import { Component } from '@angular/core';

import { NgcoreModule } from '../../../../shared/ngcore/src/lib/ngcore.module';
import { StackedLineChartComponent } from '../../../../shared/ngcommon/src/public-api';

@Component({
  selector: 'app-wireframe',
  imports: [NgcoreModule, StackedLineChartComponent],
  templateUrl: './wireframe.component.html',
  styleUrl: './wireframe.component.css'
})

export class AppWireframeComponent {}
