import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NgcoreModule } from '../../../../shared/ngcore/src/lib/ngcore.module';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgcoreModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'ngcore01-root-viewport';
}
