import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgcoreComponent } from './ngcore.component';
import { RootViewportComponent } from './root-viewport/root-viewport.component';
import { FlexSplitterHorizontalComponent, FlexSplitterSeperatorComponent } from './flex-splitter/flex-splitter.component';

@NgModule({
  declarations: [
    NgcoreComponent,
    FlexSplitterHorizontalComponent,
    FlexSplitterSeperatorComponent,
    RootViewportComponent,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    NgcoreComponent,
    FlexSplitterHorizontalComponent,
    FlexSplitterSeperatorComponent,
    RootViewportComponent,
  ]
})

export class NgcoreModule { }
