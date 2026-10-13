import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { Exhibits } from './exhibits';

describe('Exhibits', () => {
  let component: Exhibits;
  let fixture: ComponentFixture<Exhibits>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Exhibits],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Exhibits);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display all exhibits by default', () => {
    expect(component.filteredExhibits().length).toBe(6);
  });

  it('should filter exhibits by wing', () => {
    component.setWing('Circuitry Wing');
    expect(component.filteredExhibits().length).toBe(1);
    expect(component.filteredExhibits()[0].title).toBe('Logic Gate Defender');
  });

  it('should reset filters', () => {
    component.setWing('Circuitry Wing');
    component.clearFilters();
    expect(component.selectedWing()).toBe('All');
    expect(component.filteredExhibits().length).toBe(6);
  });
});
