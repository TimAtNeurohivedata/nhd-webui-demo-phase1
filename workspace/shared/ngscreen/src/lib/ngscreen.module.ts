import { NgModule } from '@angular/core';
import { NgscreenComponent } from './ngscreen.component';
import { EegAComponent } from './eeg-a/eeg-a.component';



@NgModule({
  declarations: [
    NgscreenComponent,
    EegAComponent
  ],
  imports: [
  ],
  exports: [
    NgscreenComponent,
    EegAComponent
  ]
})
export class NgscreenModule { }
