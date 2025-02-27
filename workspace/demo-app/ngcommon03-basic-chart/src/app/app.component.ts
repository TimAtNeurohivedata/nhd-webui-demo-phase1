import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NgcoreModule } from '../../../../shared/ngcore/src/lib/ngcore.module';
import { AppScreenComponent } from './screen.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgcoreModule, AppScreenComponent],
  templateUrl: './app.component.html',
})

export class AppComponent {
  title = 'ngcommon03-basic-chart';
}
