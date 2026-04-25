import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../core/services/api.services';
import { ClienteRequest, ClienteResponse } from '../../core/models/models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styles: [`
    .field {
      @apply w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm
             focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20
             transition placeholder-slate-600;
    }
    select.field { @apply bg-slate-800; }
  `],
})
export class ClientesComponent implements OnInit {
  private svc = inject(ClienteService);

  clientes  = signal<ClienteResponse[]>([]);   
  loading   = signal(true);
  saving    = signal(false);
  errorMsg  = signal('');
  showModal = signal(false);

  buscar = '';

  tipoReg = 'RUC';
  form: Partial<ClienteRequest> = {};          

  tabs = [
    { val: 'RUC',    label: '🏢 Por RUC'  },
    { val: 'DNI',    label: '🪪 Por DNI'  },
    { val: 'MANUAL', label: '✏️ Manual'   },
  ];

  filtrados = computed(() => {
    const q = this.buscar.toLowerCase();
    if (!q) return this.clientes();
    return this.clientes().filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.numeroDocumento.includes(q)
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.svc.listarTodos().subscribe({
      next: c  => { this.clientes.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openModal(): void {
    this.form = {};
    this.errorMsg.set('');
    this.tipoReg = 'RUC';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.form = {};
    this.errorMsg.set('');
  }

  guardar(): void {
    this.saving.set(true);
    this.errorMsg.set('');

    const dto = this.form as ClienteRequest;   
    const doc = this.form.numeroDocumento ?? '';

    const obs = this.tipoReg === 'RUC'
      ? this.svc.registrarRuc(doc, dto)
      : this.tipoReg === 'DNI'
        ? this.svc.registrarDni(doc, dto)
        : this.svc.registrarManual(dto);

    obs.subscribe({
      next: c  => {
        this.clientes.update(a => [c, ...a]);
        this.saving.set(false);
        this.closeModal();
      },
      error: e => {
        this.saving.set(false);
        this.errorMsg.set(e.error?.message ?? 'Error al guardar el cliente');
      },
    });
  }
}