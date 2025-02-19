import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgscreenComponent } from './ngscreen.component';

describe('NgscreenComponent', () => {
  let component: NgscreenComponent;
  let fixture: ComponentFixture<NgscreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NgscreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgscreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
