// Populating the types.ts file with all necessary type definitions and enums for the application.

// 1. Refactored User Roles
export enum UserRole {
  ANALISTA_COMERCIAL = 'Analista Comercial',
  ANALISTA_PRICING = 'Analista de Pricing',
  GESTOR_COMERCIAL = 'Gestor Comercial',
  ADMINISTRADOR = 'Administrador',
}

// 3. New Granular Permissions System
export enum Permission {
  MANAGE_SKUS = 'MANAGE_SKUS',
  MANAGE_STORE_GROUPS = 'MANAGE_STORE_GROUPS',
  MANAGE_RULES = 'MANAGE_RULES',
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  DATA_UPLOAD = 'DATA_UPLOAD',
  APPROVE_REQUESTS = 'APPROVE_REQUESTS',
  BULK_UPLOAD_REQUESTS = 'BULK_UPLOAD_REQUESTS',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMINISTRADOR]: Object.values(Permission), // Admin gets all permissions
  [UserRole.ANALISTA_PRICING]: [
    Permission.APPROVE_REQUESTS,
    Permission.MANAGE_SKUS,
    Permission.MANAGE_STORE_GROUPS,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.GESTOR_COMERCIAL]: [
      Permission.VIEW_ANALYTICS
  ],
  [UserRole.ANALISTA_COMERCIAL]: [
      Permission.BULK_UPLOAD_REQUESTS
  ], 
};

export const hasPermission = (user: User, permission: Permission): boolean => {
  // Check for individual override first
  if (user.permissions?.includes(permission)) {
    return true;
  }
  // Check for role-based permission
  if (ROLE_PERMISSIONS[user.role]?.includes(permission)) {
    return true;
  }
  return false;
};


// 2. Updated User Interface
export interface User {
  id: number;
  name: string;
  role: UserRole;
  managerId?: number;
  permissions?: Permission[];
}

export enum RequestStatus {
  PENDENTE = 'PENDENTE',
  APROVADA = 'APROVADA',
  REPROVADA = 'REPROVADA',
  AJUSTE_NECESSARIO = 'AJUSTE_NECESSARIO',
  MODIFICADA = 'MODIFICADA',
  CANCELADA = 'CANCELADA',
  ATIVA = 'ATIVA',
  FINALIZADA = 'FINALIZADA',
}

export interface AuditLogEntry {
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  details?: string;
}

export interface PromotionRequest {
  id: string;
  sku: string;
  description: string;
  priceFrom: number;
  priceTo: number;
  startDate: string;
  endDate: string;
  status: RequestStatus;
  requesterId: number; // Changed from requesterName
  createdAt: string;
  approverName?: string;
  approvalDate?: string;
  rejectionReason?: string;
  storeGroupId?: string;
  auditLog: AuditLogEntry[];
  hasRebate?: boolean;
  rebateValue?: number;
  commercialObservation?: string;
  sapActionNumber?: string;
}

export interface SKUFamily {
  id: string;
  name: string;
  skus: string[];
}

export interface StoreGroup {
    id: string;
    name: string;
    stores: string[];
}

export interface Rules {
    maxDiscountPercentage: number;
    minTimeBetweenRequests: number; // in hours
    dailyVolumeLimit: number;
}


export interface AppState {
    users: User[];
    currentUser: User;
    requests: PromotionRequest[];
    skuFamilies: SKUFamily[];
    storeGroups: StoreGroup[];
    rules: Rules;
    diffusionVolumeLastUpload?: string;
}

export type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'ADD_REQUEST'; payload: { request: Partial<PromotionRequest>, user: User } }
  | { type: 'ADD_BULK_REQUESTS'; payload: { requests: Partial<PromotionRequest>[], user: User } }
  | { type: 'UPDATE_REQUEST'; payload: { request: PromotionRequest, user: User, isModification: boolean } }
  | { type: 'UPDATE_REQUEST_STATUS'; payload: { id: string; status: RequestStatus; reason?: string; approver: User } }
  | { type: 'UPDATE_BULK_REQUEST_STATUS'; payload: { decisions: { id: string; status: RequestStatus; reason?: string; sapActionNumber?: string }[], approver: User } }
  | { type: 'CANCEL_REQUEST'; payload: { id: string; reason: string; canceller: User } }
  | { type: 'ADD_SKU_FAMILY'; payload: SKUFamily }
  | { type: 'UPDATE_SKU_FAMILY'; payload: SKUFamily }
  | { type: 'DELETE_SKU_FAMILY'; payload: string }
  | { type: 'ADD_STORE_GROUP'; payload: StoreGroup }
  | { type: 'UPDATE_STORE_GROUP'; payload: StoreGroup }
  | { type: 'DELETE_STORE_GROUP'; payload: string }
  | { type: 'UPDATE_RULES'; payload: Partial<Rules> }
  | { type: 'UPLOAD_DIFFUSION_VOLUME' }
  | { type: 'UPDATE_USER'; payload: User };