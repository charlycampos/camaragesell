/**
 * Tipos TypeScript para SIGECA
 */

export enum UserRole {
  ADMIN = 'admin',
  ASISTENTE_ADMINISTRATIVO = 'asistente_administrativo',
  PERITO = 'perito',
  FISCAL = 'fiscal',
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Sede {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Sala {
  id: number;
  nombre: string;
  capacidad?: number;
  equipamiento?: string;
  is_active: boolean;
  sede_id: number;
  created_at: string;
  updated_at?: string;
}

export interface Perito {
  id: number;
  nombres: string;
  apellidos: string;
  especialidad?: string;
  colegiatura?: string;
  telefono?: string;
  email?: string;
  is_active: boolean;
  user_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface DespachoFiscal {
  id: number;
  nombre: string;
  distrito?: string;
  direccion?: string;
  telefono?: string;
  fiscal_titular?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export enum EstadoSolicitud {
  PENDIENTE = 'pendiente',
  PROGRAMADA = 'programada',
  RECHAZADA = 'rechazada',
  CANCELADA = 'cancelada',
}

export interface Solicitud {
  id: number;
  numero_caso: string;
  tipo_diligencia: string;
  nombre_evaluado: string;
  edad_evaluado?: number;
  observaciones?: string;
  fecha_solicitud: string;
  estado: EstadoSolicitud;
  despacho_fiscal_id: number;
  solicitante_id: number;
  created_at: string;
  updated_at?: string;
}

export interface SolicitudCreate {
  numero_caso: string;
  tipo_diligencia: string;
  nombre_evaluado: string;
  edad_evaluado?: number;
  observaciones?: string;
  despacho_fiscal_id: number;
}

export enum EstadoProgramacion {
  PROGRAMADA = 'programada',
  REALIZADA = 'realizada',
  REPROGRAMADA = 'reprogramada',
  CANCELADA = 'cancelada',
  NO_ASISTIO = 'no_asistio',
}

export interface Programacion {
  id: number;
  fecha_hora: string;
  duracion_minutos: number;
  estado: EstadoProgramacion;
  notas?: string;
  solicitud_id: number;
  sala_id: number;
  perito_id: number;
  programador_id: number;
  created_at: string;
  updated_at?: string;
}

export interface ProgramacionCreate {
  fecha_hora: string;
  duracion_minutos?: number;
  solicitud_id: number;
  sala_id: number;
  perito_id: number;
}

export interface Documento {
  id: number;
  numero_dictamen: string;
  tipo_documento: string;
  fecha_emision: string;
  ruta_archivo?: string;
  observaciones?: string;
  programacion_id: number;
  registrado_por_id: number;
  created_at: string;
  updated_at?: string;
}

export interface DocumentoCreate {
  numero_dictamen: string;
  tipo_documento: string;
  fecha_emision?: string;
  observaciones?: string;
  programacion_id: number;
}
