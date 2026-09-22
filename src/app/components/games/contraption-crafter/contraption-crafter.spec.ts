import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContraptionCrafter } from './contraption-crafter';

describe('ContraptionCrafter', () => {
  let component: ContraptionCrafter;
  let fixture: ComponentFixture<ContraptionCrafter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContraptionCrafter],
    }).compileComponents();

    fixture = TestBed.createComponent(ContraptionCrafter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
