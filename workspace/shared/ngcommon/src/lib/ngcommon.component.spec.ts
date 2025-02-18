import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgcommonComponent } from './ngcommon.component';

describe('NgcommonComponent', () => {
  let component: NgcommonComponent;
  let fixture: ComponentFixture<NgcommonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NgcommonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgcommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
