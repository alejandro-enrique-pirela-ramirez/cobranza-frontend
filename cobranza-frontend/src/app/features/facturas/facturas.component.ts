import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService, ClienteService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { FacturaRequest, FacturaResponse, ClienteResponse, EstadoFactura } from '../../core/models/models';

const BADGE: Record<string, string> = {
  PENDIENTE: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  ABONADA:   'bg-blue-500/15   text-blue-400   border-blue-500/20',
  PAGADA:    'bg-green-500/15  text-green-400  border-green-500/20',
  VENCIDA:   'bg-red-500/15    text-red-400    border-red-500/20',
  ANULADA:   'bg-slate-500/15  text-slate-400  border-slate-500/20',
};

const PAGE_SIZE = 10;

type NfForm = {
  codigo?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  montoBase: number;
  moneda: string;
  idCliente: number | null;
  idUsuario?: number;
};

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturas.component.html',
  styles: [`
    .label  { @apply block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider; }
    .field  { @apply w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
  `],
})
export class FacturasComponent implements OnInit {
  private factSvc = inject(FacturaService);
  private cliSvc  = inject(ClienteService);
  private auth    = inject(AuthService);

  facturas           = signal<FacturaResponse[]>([]);
  clientes           = signal<ClienteResponse[]>([]);
  loading            = signal(true);
  saving             = signal(false);
  errorNueva         = signal('');
  showNueva          = signal(false);
  showAnular         = signal(false);
  showEstado         = signal(false);
  filtroActual       = signal('ALL');
  clienteFiltro      = signal<string>('');
  busquedaFiltro     = signal('');
  dropdownFiltroOpen = signal(false);
  paginaActual       = signal(1);
  dropdownNuevaOpen  = signal(false);
  busquedaNueva      = signal('');
  factSeleccionada   = signal<FacturaResponse | null>(null);
  motivoAnulacion    = '';
  nuevoEstado        = '';

  nf: NfForm = { moneda: 'PEN', montoBase: 0, idCliente: null };

  filtros = [
    { val: 'ALL',       label: 'Todas'      },
    { val: 'PENDIENTE', label: 'Pendientes' },
    { val: 'ABONADA',   label: 'Abonadas'   },
    { val: 'PAGADA',    label: 'Pagadas'    },
    { val: 'VENCIDA',   label: 'Vencidas'   },
    { val: 'ANULADA',   label: 'Anuladas'   },
  ];

  estadosDisponibles = [
    { val: 'PENDIENTE', label: '🟡 PENDIENTE' },
    { val: 'PAGADA',    label: '🟢 PAGADA'    },
    { val: 'VENCIDA',   label: '🔴 VENCIDA'   },
  ];

  facturasPagina = computed(() => {
    const inicio = (this.paginaActual() - 1) * PAGE_SIZE;
    return this.facturas().slice(inicio, inicio + PAGE_SIZE);
  });

  totalPaginas = computed(() => Math.ceil(this.facturas().length / PAGE_SIZE));
  paginas      = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));
  rangoInicio  = computed(() => this.facturas().length === 0 ? 0 : (this.paginaActual() - 1) * PAGE_SIZE + 1);
  rangoFin     = computed(() => Math.min(this.paginaActual() * PAGE_SIZE, this.facturas().length));

  clientesFiltradosFiltro = computed(() => {
    const b = this.busquedaFiltro().toLowerCase();
    if (!b) return this.clientes();
    return this.clientes().filter(c =>
      c.nombre.toLowerCase().includes(b) || c.numeroDocumento.includes(b)
    );
  });

  clienteFiltroSeleccionado = computed(() =>
    this.clientes().find(c => c.idCliente.toString() === this.clienteFiltro())
  );

  clientesFiltradosNueva = computed(() => {
    const b = this.busquedaNueva().toLowerCase();
    if (!b) return this.clientes();
    return this.clientes().filter(c =>
      c.nombre.toLowerCase().includes(b) || c.numeroDocumento.includes(b)
    );
  });

  get clienteNuevaSeleccionado(): ClienteResponse | null {
    if (!this.nf.idCliente) return null;
    return this.clientes().find(c => c.idCliente === this.nf.idCliente) ?? null;
  }

  badge(e: string) { return BADGE[e] ?? ''; }

  ngOnInit() {
    this.cliSvc.listarTodos().subscribe(c => this.clientes.set(c));
    this.cargar();
  }

  setFiltro(f: string)  { this.filtroActual.set(f); this.paginaActual.set(1); this.cargar(); }
  irPagina(p: number)   { if (p >= 1 && p <= this.totalPaginas()) this.paginaActual.set(p); }

  seleccionarClienteFiltro(id: number | string) {
    this.clienteFiltro.set(id.toString());
    this.busquedaFiltro.set('');
    this.paginaActual.set(1);
    this.cargar();
  }

  limpiarCliente() {
    this.clienteFiltro.set('');
    this.busquedaFiltro.set('');
    this.paginaActual.set(1);
    this.cargar();
  }

  cargar() {
    this.loading.set(true);

    if (this.clienteFiltro()) {
      this.factSvc.listarPorCliente(Number(this.clienteFiltro())).subscribe({
        next: fs => { this.facturas.set(fs); this.loading.set(false); },
        error: ()  => this.loading.set(false),
      });
      return;
    }

    if (this.filtroActual() === 'ALL') {
      const estados: EstadoFactura[] = ['PENDIENTE', 'ABONADA', 'PAGADA', 'VENCIDA', 'ANULADA'];
      let all: FacturaResponse[] = [], done = 0;
      estados.forEach(e => {
        const obs = e === 'VENCIDA' ? this.factSvc.listarVencidas() : this.factSvc.listarPorEstado(e);
        obs.subscribe({
          next: fs => {
            all = [...all, ...fs];
            if (++done === estados.length) {
              all.sort((a, b) => b.idFactura - a.idFactura);
              this.facturas.set(all);
              this.loading.set(false);
            }
          },
          error: () => { if (++done === estados.length) this.loading.set(false); },
        });
      });
      return;
    }

    const obs = this.filtroActual() === 'VENCIDA'
      ? this.factSvc.listarVencidas()
      : this.factSvc.listarPorEstado(this.filtroActual() as EstadoFactura);

    obs.subscribe({
      next: fs => { fs.sort((a, b) => b.idFactura - a.idFactura); this.facturas.set(fs); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openNueva() {
    this.nf = {
      moneda: 'PEN',
      montoBase: 0,
      idCliente: null,
      idUsuario: this.auth.currentUser()?.idUsuario,
    };
    this.errorNueva.set('');
    this.busquedaNueva.set('');
    this.dropdownNuevaOpen.set(false);
    this.showNueva.set(true);
  }

  seleccionarClienteNueva(c: ClienteResponse) {
    this.nf = { ...this.nf, idCliente: c.idCliente };
    this.dropdownNuevaOpen.set(false);
    this.busquedaNueva.set('');
  }

  guardarFactura() {
    if (!this.nf.codigo || !this.nf.idCliente || !this.nf.fechaEmision ||
        !this.nf.fechaVencimiento || !this.nf.montoBase) {
      this.errorNueva.set('Completa todos los campos obligatorios'); return;
    }
    this.saving.set(true);
    this.errorNueva.set('');
    this.factSvc.registrar(this.nf as FacturaRequest).subscribe({
      next: f  => { this.facturas.update(a => [f, ...a]); this.saving.set(false); this.showNueva.set(false); },
      error: e => { this.saving.set(false); this.errorNueva.set(e.error?.message ?? 'Error al registrar la factura'); },
    });
  }

  abrirCambiarEstado(f: FacturaResponse) {
    this.factSeleccionada.set(f);
    this.nuevoEstado = f.estado;
    this.showEstado.set(true);
  }

  confirmarCambioEstado() {
    this.saving.set(true);
    this.factSvc.cambiarEstado(this.factSeleccionada()!.idFactura, this.nuevoEstado as EstadoFactura).subscribe({
      next: f  => { this.facturas.update(a => a.map(x => x.idFactura === f.idFactura ? f : x)); this.saving.set(false); this.showEstado.set(false); },
      error: () => this.saving.set(false),
    });
  }

  abrirAnular(f: FacturaResponse) {
    this.factSeleccionada.set(f);
    this.motivoAnulacion = '';
    this.showAnular.set(true);
  }

  confirmarAnular() {
    if (!this.motivoAnulacion.trim()) return;
    this.saving.set(true);
    this.factSvc.anular(this.factSeleccionada()!.idFactura, this.motivoAnulacion).subscribe({
      next: f  => { this.facturas.update(a => a.map(x => x.idFactura === f.idFactura ? f : x)); this.saving.set(false); this.showAnular.set(false); },
      error: () => this.saving.set(false),
    });
  }
}