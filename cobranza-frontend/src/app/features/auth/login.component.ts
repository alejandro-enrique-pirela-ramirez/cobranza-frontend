import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  loading  = signal(false);
  error    = signal('');
  year     = new Date().getFullYear();

  login() {
    if (!this.username.trim() || !this.password.trim()) {
      this.error.set('Por favor ingresa usuario y contraseña');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.loading.set(false);
        this.error.set(
          e.status === 401 ? 'Usuario o contraseña incorrectos' :
          e.status === 0   ? 'No se puede conectar con el servidor' :
                             'Error al iniciar sesión, intenta de nuevo'
        );
      },
    });
  }
}