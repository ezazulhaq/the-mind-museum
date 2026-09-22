import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TerminalVelocity } from './terminal-velocity';

describe('TerminalVelocity', () => {
  let component: TerminalVelocity;
  let fixture: ComponentFixture<TerminalVelocity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminalVelocity],
    }).compileComponents();

    fixture = TestBed.createComponent(TerminalVelocity);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
