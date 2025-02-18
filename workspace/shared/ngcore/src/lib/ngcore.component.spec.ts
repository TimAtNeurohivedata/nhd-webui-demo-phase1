import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgcoreComponent } from './ngcore.component';

describe('NgcoreComponent', () => {
  let component: NgcoreComponent;
  let fixture: ComponentFixture<NgcoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NgcoreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgcoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
