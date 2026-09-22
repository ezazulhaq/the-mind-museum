import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NodeNetwork } from './node-network';

describe('NodeNetwork', () => {
  let component: NodeNetwork;
  let fixture: ComponentFixture<NodeNetwork>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeNetwork],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeNetwork);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
