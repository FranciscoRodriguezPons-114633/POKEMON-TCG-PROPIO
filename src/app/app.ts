import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FxLayerComponent } from './features/fx-layer/fx-layer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FxLayerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
