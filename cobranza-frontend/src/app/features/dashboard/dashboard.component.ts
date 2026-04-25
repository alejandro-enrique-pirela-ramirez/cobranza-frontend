import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FacturaService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { FacturaResponse } from '../../core/models/models';  // ← FacturaResponse

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private facturaService = inject(FacturaService);
  auth = inject(AuthService);

  loading  = signal(true);
  vencidas = signal<FacturaResponse[]>([]);  // ← FacturaResponse
  stats    = signal<StatCard[]>([]);

  ngOnInit(): void {
    const counts: Record<string, number> = {};
    const estados = ['PENDIENTE', 'ABONADA', 'PAGADA', 'ANULADA'] as const;
    let pending = estados.length + 1;

    const finish = () => { if (--pending === 0) { this.buildStats(counts); this.loading.set(false); } };

    this.facturaService.listarVencidas().subscribe({
      next: v => { this.vencidas.set(v); counts['VENCIDA'] = v.length; finish(); },
      error: finish
    });

    estados.forEach(e => {
      this.facturaService.listarPorEstado(e).subscribe({
        next: fs => { counts[e] = fs.length; finish(); },
        error: finish
      });
    });
  }

  buildStats(c: Record<string, number>): void {
    this.stats.set([
      { label: 'Pendientes', value: c['PENDIENTE'] ?? 0, icon: '📋', color: 'text-yellow-400' },
      { label: 'Vencidas',   value: c['VENCIDA']   ?? 0, icon: '⚠️',  color: 'text-red-400'   },
      { label: 'Abonadas',   value: c['ABONADA']   ?? 0, icon: '💳', color: 'text-blue-400'   },
      { label: 'Pagadas',    value: c['PAGADA']    ?? 0, icon: '✅', color: 'text-green-400'  },
    ]);
  }
}