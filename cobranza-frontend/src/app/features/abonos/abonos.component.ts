import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AbonoService, FacturaService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { AbonoRequest, AbonoResponse, FacturaResponse, EstadoFactura } from '../../core/models/models';

type AbonoForm = {
  idFactura?: number;
  monto: number;
  fechaAbono?: string;
  metodoPago?: string;
  observacion?: string;
};

@Component({
  selector: 'app-abonos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './abonos.component.html',
  styles: [`
    .th    { @apply text-left text-slate-500 text-xs font-semibold uppercase tracking-wider px-5 py-3; }
    .td    { @apply px-5 py-3.5; }
    .field { @apply w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm
                    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20
                    transition placeholder-slate-600; }
    select.field { @apply bg-slate-800; }
    .label { @apply block text-slate-400 text-xs font-semibold mb-1.5; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; border-radius: 10px; }
  `]
})
export class AbonosComponent implements OnInit {
  private abonoSvc = inject(AbonoService);
  private factSvc  = inject(FacturaService);
  private auth     = inject(AuthService);

  abonos     = signal<AbonoResponse[]>([]);
  facturas   = signal<FacturaResponse[]>([]);
  facturaSel = signal<FacturaResponse | null>(null);
  showModal  = signal(false);
  saving     = signal(false);
  errorMsg   = signal('');
  buscado    = signal(false);

  form: AbonoForm = { monto: 0 };

  dropdownOpen = signal(false);
  busqueda     = signal('');

  facturasFiltradas = computed(() => {
    const b = this.busqueda().toLowerCase();
    if (!b) return this.facturas();
    return this.facturas().filter(f =>
      f.codigo.toLowerCase().includes(b) ||
      (f.cliente?.nombre && f.cliente.nombre.toLowerCase().includes(b))
    );
  });

  ngOnInit(): void { this.cargarFacturas(); }

  cargarFacturas(): void {
    this.facturas.set([]);
    let all: FacturaResponse[] = [];
    let procesados = 0;
    const estados: EstadoFactura[] = ['PENDIENTE', 'ABONADA', 'VENCIDA', 'PAGADA'];

    estados.forEach(e => {
      const obs = e === 'VENCIDA' ? this.factSvc.listarVencidas() : this.factSvc.listarPorEstado(e);
      obs.subscribe({
        next: fs => {
          all = [...all, ...fs];
          if (++procesados === estados.length) {
            all.sort((a, b) => b.idFactura - a.idFactura);
            this.facturas.set(all);
          }
        },
        error: () => {
          if (++procesados === estados.length) {
            all.sort((a, b) => b.idFactura - a.idFactura);
            this.facturas.set(all);
          }
        }
      });
    });
  }

  totalAbonado(): number { return this.abonos().reduce((s, a) => s + a.monto, 0); }

  seleccionarFactura(f: FacturaResponse): void {
    this.facturaSel.set(f);
    this.busqueda.set('');
    this.dropdownOpen.set(false);
    this.buscarAbonos(f.idFactura);
  }

  buscarAbonos(idFactura: number): void {
    this.buscado.set(false);
    this.abonoSvc.listarPorFactura(idFactura).subscribe({
      next: a  => { this.abonos.set(a); this.buscado.set(true); },
      error: () => { this.abonos.set([]); this.buscado.set(true); }
    });
  }

  abrirModal(): void {
    const f = this.facturaSel();
    if (!f) return;
    this.form = {
      idFactura: f.idFactura,
      fechaAbono: new Date().toISOString().split('T')[0],
      metodoPago: '',
      monto: 0,
    };
    this.errorMsg.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.form = { monto: 0 }; this.errorMsg.set(''); }

  guardar(): void {
    if (!this.form.idFactura || this.form.monto <= 0 ||
        !this.form.fechaAbono || !this.form.metodoPago) {
      this.errorMsg.set('Completa todos los campos. El monto debe ser mayor a 0.'); return;
    }
    this.saving.set(true);
    this.errorMsg.set('');

    const dto: AbonoRequest = {
      idFactura:  this.form.idFactura,
      monto:      this.form.monto,
      fechaAbono: this.form.fechaAbono,
      metodoPago: this.form.metodoPago,
      observacion: this.form.observacion,
      idUsuario:  this.auth.currentUser()!.idUsuario,
    };

    this.abonoSvc.registrar(dto).subscribe({
      next: () => {
        const montoAbonado = this.form.monto;
        this.saving.set(false);
        this.closeModal();
        this.buscarAbonos(this.facturaSel()!.idFactura);
        this.facturaSel.update(f => f ? { ...f, saldo: f.saldo - montoAbonado } : null);
        this.cargarFacturas();
      },
      error: e => { this.saving.set(false); this.errorMsg.set(e.error?.message ?? 'Error al registrar el abono'); }
    });
  }
}