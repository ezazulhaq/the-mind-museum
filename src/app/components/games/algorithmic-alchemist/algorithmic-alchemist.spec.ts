import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlgorithmicAlchemist } from './algorithmic-alchemist';

describe('AlgorithmicAlchemist', () => {
  let component: AlgorithmicAlchemist;
  let fixture: ComponentFixture<AlgorithmicAlchemist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlgorithmicAlchemist],
    }).compileComponents();

    fixture = TestBed.createComponent(AlgorithmicAlchemist);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
