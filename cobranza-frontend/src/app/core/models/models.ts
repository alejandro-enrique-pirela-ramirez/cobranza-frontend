// ─── CLIENTE ────────────────────────────────────────────────
export interface ClienteRequest {
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  direccion?: string;
  correo?: string;
  telefono?: string;
}

export interface ClienteResponse {
  idCliente: number;       
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  direccion?: string;
  correo?: string;
  telefono?: string;
}

export interface UsuarioRequest {
  username: string;
  password: string;
  rol: string;
  nombreCompleto: string;
}

export interface UsuarioResponse {
  idUsuario: number;
  username: string;
  rol: string;
  nombreCompleto: string;
  activo: boolean;
}
export type EstadoFactura = 'PENDIENTE' | 'ABONADA' | 'PAGADA' | 'VENCIDA' | 'ANULADA';

export interface FacturaRequest {
  codigo: string;
  fechaEmision: string;
  fechaVencimiento: string;
  montoBase: number;
  moneda: string;
  idCliente: number;
  idUsuario: number;
}

export interface FacturaResponse {
  idFactura: number;
  codigo: string;
  fechaEmision: string;
  fechaVencimiento: string;
  montoBase: number;
  igv: number;
  total: number;
  saldo: number;
  moneda: string;
  estado: EstadoFactura;
  motivoAnulacion?: string;
  fechaAnulacion?: string;
  cliente?: ClienteResponse;
  usuario?: UsuarioResponse;
}

export interface AbonoRequest {
  monto: number;
  fechaAbono: string;
  metodoPago: string;
  observacion?: string;
  idFactura: number;
  idUsuario: number;
}

export interface AbonoResponse {
  idAbono: number;
  monto: number;
  fechaAbono: string;
  metodoPago: string;
  saldoRestante: number;
  observacion?: string;
  factura?: FacturaResponse;
  usuario?: UsuarioResponse;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  rol: string;
  nombreCompleto: string;
  idUsuario: number;
}