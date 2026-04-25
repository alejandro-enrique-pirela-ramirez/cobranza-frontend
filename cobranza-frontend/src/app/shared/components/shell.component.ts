import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  auth = inject(AuthService);

  initials(): string {
    return (this.auth.currentUser()?.nombreCompleto ?? '')
      .split(' ').slice(0, 2).map((n: string) => n[0] ?? '').join('').toUpperCase();
  }
}