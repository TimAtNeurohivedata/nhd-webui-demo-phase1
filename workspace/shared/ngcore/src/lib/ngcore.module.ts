import { NgModule } from '@angular/core';
import { NgcoreComponent } from './ngcore.component';
import { RootViewportComponent } from './root-viewport/root-viewport.component';



@NgModule({
  declarations: [
    NgcoreComponent,
    RootViewportComponent
  ],
  imports: [
  ],
  exports: [
    NgcoreComponent,
    RootViewportComponent
  ]
})
export class NgcoreModule { }
