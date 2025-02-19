import { Component } from '@angular/core';

import { NgcoreModule } from '../../../../shared/ngcore/src/lib/ngcore.module';
import { NgcommonModule } from '../../../../shared/ngcommon/src/lib/ngcommon.module';

@Component({
  selector: 'app-wireframe',
  imports: [NgcoreModule, NgcommonModule],
  templateUrl: './wireframe.component.html',
  styleUrl: './wireframe.component.css'
})

export class AppWireframeComponent {}
