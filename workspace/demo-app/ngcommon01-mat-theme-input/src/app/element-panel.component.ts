import { Component } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { NgcoreModule } from '../../../../shared/ngcore/src/lib/ngcore.module';
import { NgcommonModule } from '../../../../shared/ngcommon/src/lib/ngcommon.module';

@Component({
  selector: 'app-element-panel',
  imports: [MatButtonModule, NgcoreModule, NgcommonModule],
  templateUrl: './element-panel.component.html',
  styleUrl: './element-panel.component.css'
})

export class AppElementPanelComponent {}
