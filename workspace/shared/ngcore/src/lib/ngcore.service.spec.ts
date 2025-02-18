import { TestBed } from '@angular/core/testing';

import { NgcoreService } from './ngcore.service';

describe('NgcoreService', () => {
  let service: NgcoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgcoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
