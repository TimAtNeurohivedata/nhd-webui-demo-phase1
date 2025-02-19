import { TestBed } from '@angular/core/testing';

import { NgscreenService } from './ngscreen.service';

describe('NgscreenService', () => {
  let service: NgscreenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgscreenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
