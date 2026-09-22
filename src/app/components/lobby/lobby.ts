import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './lobby.html',
  styleUrl: './lobby.scss'
})
export class Lobby { }
