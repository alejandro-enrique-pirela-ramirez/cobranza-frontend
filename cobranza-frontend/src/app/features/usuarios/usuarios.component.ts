import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../core/services/api.services';
import { UsuarioRequest, UsuarioResponse } from '../../core/models/models';  // ← separados

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styles: [`
    .th    { @apply text-left text-slate-500 text-xs font-semibold uppercase tracking-wider px-6 py-4; }
    .td    { @apply px-6 py-4; }
    .field { @apply w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm
                    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20
                    transition placeholder-slate-600; }
    select.field { @apply bg-slate-800; }
    .label { @apply block text-slate-400 text-xs font-semibold mb-1.5; }
  `],
})
export class UsuariosComponent implements OnInit {
  private svc = inject(UsuarioService);

  usuarios            = signal<UsuarioResponse[]>([]);          // ← UsuarioResponse
  loading             = signal(true);
  showModal           = signal(false);
  showRol             = signal(false);
  saving              = signal(false);
  errorMsg            = signal('');
  usuarioSeleccionado = signal<UsuarioResponse | null>(null);   // ← UsuarioResponse
  nuevoRol            = 'OPERADOR';
  form: Partial<UsuarioRequest> = {};                           // ← UsuarioRequest parcial

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.listarTodos().subscribe({
      next:  u => { this.usuarios.set(u); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openModal()  { this.form = {}; this.errorMsg.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  guardar() {
    if (!this.form.username || !this.form.password || !this.form.rol || !this.form.nombreCompleto) {
      this.errorMsg.set('Completa todos los campos'); return;
    }
    this.saving.set(true);
    this.errorMsg.set('');

    this.svc.registrar(this.form as UsuarioRequest).subscribe({  // ← cast al enviar
      next:  u => { this.usuarios.update(a => [u, ...a]); this.saving.set(false); this.closeModal(); },
      error: e => { this.saving.set(false); this.errorMsg.set(e.error?.message ?? 'Error al crear el usuario'); },
    });
  }

  abrirCambioRol(u: UsuarioResponse) {                          // ← UsuarioResponse
    this.usuarioSeleccionado.set(u);
    this.nuevoRol = u.rol;
    this.showRol.set(true);
  }

  confirmarRol() {
    this.saving.set(true);
    this.svc.actualizarRol(this.usuarioSeleccionado()!.idUsuario, this.nuevoRol).subscribe({
      next:  u  => {
        this.usuarios.update(a => a.map(x => x.idUsuario === u.idUsuario ? u : x));
        this.saving.set(false);
        this.showRol.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  desactivar(u: UsuarioResponse) {                              // ← UsuarioResponse
    if (!confirm(`¿Desactivar al usuario "${u.nombreCompleto}"?`)) return;
    this.svc.desactivar(u.idUsuario).subscribe({
      next: () => this.usuarios.update(a =>
        a.map(x => x.idUsuario === u.idUsuario ? { ...x, activo: false } : x)
      ),
    });
  }
}