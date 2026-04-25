import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ClienteRequest, ClienteResponse,
  FacturaRequest, FacturaResponse,
  AbonoRequest, AbonoResponse,
  UsuarioRequest, UsuarioResponse,
  EstadoFactura
} from '../models/models';

const BASE = 'https://sistemacobranzafanox.onrender.com/api';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);

  listarTodos()                                         { return this.http.get<ClienteResponse[]>(`${BASE}/clientes`); }
  buscarPorId(id: number)                               { return this.http.get<ClienteResponse>(`${BASE}/clientes/${id}`); }
  registrarManual(dto: ClienteRequest)                  { return this.http.post<ClienteResponse>(`${BASE}/clientes/registrar-manual`, dto); }
  registrarRuc(ruc: string, dto: ClienteRequest)        { return this.http.post<ClienteResponse>(`${BASE}/clientes/registrar-ruc/${ruc}`, dto); }
  registrarDni(dni: string, dto: ClienteRequest)        { return this.http.post<ClienteResponse>(`${BASE}/clientes/registrar-dni/${dni}`, dto); }
}

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private http = inject(HttpClient);

  registrar(dto: FacturaRequest)                        { return this.http.post<FacturaResponse>(`${BASE}/facturas`, dto); }
  buscarPorId(id: number)                               { return this.http.get<FacturaResponse>(`${BASE}/facturas/${id}`); }
  listarPorCliente(id: number)                          { return this.http.get<FacturaResponse[]>(`${BASE}/facturas/cliente/${id}`); }
  listarPorEstado(e: EstadoFactura)                     { return this.http.get<FacturaResponse[]>(`${BASE}/facturas/estado/${e}`); }
  listarVencidas()                                      { return this.http.get<FacturaResponse[]>(`${BASE}/facturas/vencidas`); }
  anular(id: number, motivo: string)                    { return this.http.patch<FacturaResponse>(`${BASE}/facturas/${id}/anular`, null, { params: new HttpParams().set('motivo', motivo) }); }
  cambiarEstado(id: number, estado: EstadoFactura)      { return this.http.patch<FacturaResponse>(`${BASE}/facturas/${id}/estado`, null, { params: new HttpParams().set('estado', estado) }); }
}

@Injectable({ providedIn: 'root' })
export class AbonoService {
  private http = inject(HttpClient);

  registrar(dto: AbonoRequest)                          { return this.http.post<AbonoResponse>(`${BASE}/abonos`, dto); }
  listarPorFactura(id: number)                          { return this.http.get<AbonoResponse[]>(`${BASE}/abonos/factura/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);

  registrar(dto: UsuarioRequest)                        { return this.http.post<UsuarioResponse>(`${BASE}/usuarios`, dto); }
  listarTodos()                                         { return this.http.get<UsuarioResponse[]>(`${BASE}/usuarios`); }
  buscarPorId(id: number)                               { return this.http.get<UsuarioResponse>(`${BASE}/usuarios/${id}`); }
  actualizarRol(id: number, rol: string)                { return this.http.patch<UsuarioResponse>(`${BASE}/usuarios/${id}/rol`, null, { params: new HttpParams().set('rol', rol) }); }
  desactivar(id: number)                                { return this.http.delete<void>(`${BASE}/usuarios/${id}`); }
}