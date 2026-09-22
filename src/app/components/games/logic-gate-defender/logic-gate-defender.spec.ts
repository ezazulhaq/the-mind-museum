import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogicGateDefender } from './logic-gate-defender';

describe('LogicGateDefender', () => {
  let component: LogicGateDefender;
  let fixture: ComponentFixture<LogicGateDefender>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogicGateDefender],
    }).compileComponents();

    fixture = TestBed.createComponent(LogicGateDefender);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
