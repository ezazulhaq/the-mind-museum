import { describe, it, expect, beforeEach } from 'vitest';
import { Exhibits } from './exhibits';

describe('Exhibits Component', () => {
  let component: Exhibits;

  beforeEach(() => {
    component = new Exhibits();
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

  it('should filter exhibits by search query', () => {
    component.onSearchChange('Dijkstra');
    expect(component.filteredExhibits().length).toBe(1);
    expect(component.filteredExhibits()[0].id).toBe('node-network');
  });

  it('should reset filters', () => {
    component.setWing('Circuitry Wing');
    component.onSearchChange('Logic');
    component.clearFilters();
    expect(component.selectedWing()).toBe('All');
    expect(component.searchQuery()).toBe('');
    expect(component.filteredExhibits().length).toBe(6);
  });

  it('should manage modal details display', () => {
    const firstExhibit = component.exhibits()[0];
    component.openDetails(firstExhibit);
    expect(component.activeModalExhibit()?.id).toBe(firstExhibit.id);
    component.closeDetails();
    expect(component.activeModalExhibit()).toBeNull();
  });
});
