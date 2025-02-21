import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NgcoreModule } from '../../../../shared/ngcore/src/lib/ngcore.module';
import { StackedLineChartComponent } from '../../../../shared/ngcommon/src/public-api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgcoreModule, StackedLineChartComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'ngcommon02-stacked-line-chart';
}
