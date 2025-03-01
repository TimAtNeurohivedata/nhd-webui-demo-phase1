import { Component } from '@angular/core';

import { NgcoreModule } from 'ngcore';
import { NgcommonModule } from '../../../../shared/ngcommon/src/lib/ngcommon.module';
import { AppElementPanelComponent } from './element-panel.component';

@Component({
  selector: 'app-screen',
  imports: [NgcoreModule, NgcommonModule, AppElementPanelComponent],
  templateUrl: './screen.component.html'
})

export class AppScreenComponent {}
