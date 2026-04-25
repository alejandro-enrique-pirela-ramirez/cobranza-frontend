import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './shared/components/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./features/clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'facturas',
        loadComponent: () => import('./features/facturas/facturas.component').then(m => m.FacturasComponent)
      },
      {
        path: 'abonos',
        loadComponent: () => import('./features/abonos/abonos.component').then(m => m.AbonosComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
