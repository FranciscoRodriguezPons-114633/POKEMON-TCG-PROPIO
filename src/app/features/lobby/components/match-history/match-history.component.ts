import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-match-history',
  imports: [CommonModule],
  templateUrl: './match-history.component.html',
  styleUrl: './match-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchHistoryComponent {
  @Output() close = new EventEmitter<void>();
}

