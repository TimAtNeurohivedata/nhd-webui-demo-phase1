import { TestBed } from '@angular/core/testing';

import { NgcommonService } from './ngcommon.service';

describe('NgcommonService', () => {
  let service: NgcommonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgcommonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
