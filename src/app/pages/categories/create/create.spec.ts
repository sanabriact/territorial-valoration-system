import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CategoryCreateComponent } from './create';

describe('CategoryCreateComponent', () => {
  let component: CategoryCreateComponent;
  let fixture: ComponentFixture<CategoryCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryCreateComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
