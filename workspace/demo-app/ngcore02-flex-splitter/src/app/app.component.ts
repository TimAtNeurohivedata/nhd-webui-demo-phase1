import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NgcoreModule } from '../../../../shared/ngcore/src/lib/ngcore.module';
import { DemoScreenFlexSplitterComponent } from './screen.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgcoreModule, DemoScreenFlexSplitterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'ngcore02-flex-splitter';
}
