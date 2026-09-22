import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OpticArchitect } from './optic-architect';

describe('OpticArchitect', () => {
  let component: OpticArchitect;
  let fixture: ComponentFixture<OpticArchitect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpticArchitect],
    }).compileComponents();

    fixture = TestBed.createComponent(OpticArchitect);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
