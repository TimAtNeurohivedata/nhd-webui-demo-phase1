import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NgcoreModule } from 'ngcore';
import { AppScreenComponent } from './screen.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgcoreModule, AppScreenComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'ngcommon01-mat-theme-input';
}
