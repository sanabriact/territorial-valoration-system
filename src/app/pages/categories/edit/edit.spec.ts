import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CategoryEditComponent } from './edit';

describe('CategoryEditComponent', () => {
  let component: CategoryEditComponent;
  let fixture: ComponentFixture<CategoryEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryEditComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryEditComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
