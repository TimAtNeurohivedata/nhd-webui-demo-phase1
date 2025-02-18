import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';

import { MatSelectModule} from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { NgcommonComponent } from './ngcommon.component';
import { MatThemeInputComponent } from './mat-theme-input/mat-theme-input.component';

@NgModule({
  declarations: [
    NgcommonComponent,
    MatThemeInputComponent
  ],
  imports: [
    CommonModule, MatSelectModule, MatFormFieldModule, MatIconModule, MatMenuModule
  ],
  exports: [
    NgcommonComponent,
    MatThemeInputComponent
  ],
  providers: [provideAnimations()],
})

export class NgcommonModule { }
