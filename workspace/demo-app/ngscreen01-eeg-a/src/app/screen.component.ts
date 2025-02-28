import { Component } from '@angular/core';

import { NgcoreModule } from '../../../../shared/ngcore/src/lib/ngcore.module';
import { NgcommonModule, ChartOptionsContainerComponent } from 'ngcommon';
import { OasisPanelWireframeSettingsComponent } from './wireframe-settings.component';
import { AppWireframeComponent } from './wireframe.component';

@Component({
    selector: 'app-screen',
    imports: [NgcoreModule, NgcommonModule, ChartOptionsContainerComponent, OasisPanelWireframeSettingsComponent, AppWireframeComponent],
    templateUrl: './screen.component.html'
})

export class AppScreenComponent {}
