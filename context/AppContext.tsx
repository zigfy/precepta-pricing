// Implementing the AppContext with state reducer, initial data, and provider.
import React, { createContext, useContext, useReducer, Dispatch } from 'react';
import { AppState, AppAction, User, UserRole, RequestStatus, PromotionRequest, SKUFamily, StoreGroup, Rules, AuditLogEntry, Permission } from '../types';

// Mock Data with new Roles and structure
const users: User[] = [
  { id: 1, name: 'Ana Silva', role: UserRole.ANALISTA_COMERCIAL, managerId: 4 },
  { id: 2, name: 'Bruno Costa', role: UserRole.ANALISTA_PRICING },
  { id: 3, name: 'Carlos Dias', role: UserRole.ADMINISTRADOR },
  { id: 4, name: 'Daniela Rocha', role: UserRole.GESTOR_COMERCIAL },
  { id: 5, name: 'Eduardo Lima', role: UserRole.ANALISTA_COMERCIAL, permissions: [Permission.MANAGE_SKUS] } // Analyst with special permission
];

const createLog = (user: User, action: string, details?: string): AuditLogEntry => ({
    timestamp: new Date().toISOString(),
    user: user.name,
    role: user.role,
    action,
    details
});

const requests: PromotionRequest[] = [
    { id: 'req-1', sku: 'SKU001', description: 'Promoção de Lançamento - Tênis Runner', priceFrom: 299.90, priceTo: 199.90, startDate: '2024-07-20', endDate: '2024-08-20', status: RequestStatus.APROVADA, requesterId: 1, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), approverName: 'Bruno Costa', approvalDate: new Date(Date.now() - 86400000 * 4).toISOString(), auditLog: [
        { timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), user: 'Ana Silva', role: UserRole.ANALISTA_COMERCIAL, action: 'Criação da Solicitação' },
        { timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), user: 'Bruno Costa', role: UserRole.ANALISTA_PRICING, action: 'Aprovada' }
    ], hasRebate: true, rebateValue: 10.00, commercialObservation: 'Ação de marketing para o Dia dos Pais.', sapActionNumber: 'SAP12345' },
    { id: 'req-2', sku: 'SKU002', description: 'Queima de Estoque - Camiseta Básica', priceFrom: 79.90, priceTo: 49.90, startDate: '2024-08-01', endDate: '2024-08-15', status: RequestStatus.PENDENTE, requesterId: 1, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), auditLog: [
        { timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), user: 'Ana Silva', role: UserRole.ANALISTA_COMERCIAL, action: 'Criação da Solicitação' }
    ]},
    { id: 'req-3', sku: 'SKU003', description: 'Desconto Progressivo - Jeans', priceFrom: 199.90, priceTo: 179.90, startDate: '2024-07-25', endDate: '2024-08-05', status: RequestStatus.REPROVADA, requesterId: 5, createdAt: new Date().toISOString(), approverName: 'Bruno Costa', rejectionReason: 'Margem muito baixa.', auditLog: [
        { timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), user: 'Eduardo Lima', role: UserRole.ANALISTA_COMERCIAL, action: 'Criação da Solicitação' },
        { timestamp: new Date().toISOString(), user: 'Bruno Costa', role: UserRole.ANALISTA_PRICING, action: 'Reprovada', details: 'Margem muito baixa.' }
    ], commercialObservation: 'Tentativa de queima de estoque para coleção passada.'},
    { id: 'req-4', sku: 'SKU004', description: 'Promoção de Inverno - Casaco de Lã', priceFrom: 499.90, priceTo: 349.90, startDate: '2024-07-15', endDate: '2024-07-30', status: RequestStatus.PENDENTE, requesterId: 5, createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), auditLog: [
        { timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), user: 'Eduardo Lima', role: UserRole.ANALISTA_COMERCIAL, action: 'Criação da Solicitação' }
    ]},
];

const skuFamilies: SKUFamily[] = [
    { id: 'fam-1', name: 'Calçados Esportivos', skus: ['SKU001', 'SKU101', 'SKU102'] },
    { id: 'fam-2', name: 'Roupas de Verão', skus: ['SKU002', 'SKU201', 'SKU202'] },
];

const storeGroups: StoreGroup[] = [
    { id: 'grp-1', name: 'Lojas de Shopping', stores: ['Shopping A', 'Shopping B'] },
    { id: 'grp-2', name: 'Lojas de Rua', stores: ['Rua Principal', 'Avenida Central'] },
];

const rules: Rules = {
    maxDiscountPercentage: 50,
    minTimeBetweenRequests: 24,
    dailyVolumeLimit: 10,
};

const initialState: AppState = {
  users,
  currentUser: users[2], // Start as Administrador
  requests,
  skuFamilies,
  storeGroups,
  rules,
  diffusionVolumeLastUpload: new Date(Date.now() - 86400000 * 2).toISOString(), // Mocked to be 2 days ago
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'ADD_REQUEST': {
      const { request, user } = action.payload;
      const newRequest: PromotionRequest = {
          ...request,
          id: `req-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: RequestStatus.PENDENTE,
          requesterId: user.id, // Changed to ID
          auditLog: [createLog(user, 'Criação da Solicitação')],
      } as PromotionRequest;
      return { ...state, requests: [...state.requests, newRequest] };
    }
    case 'ADD_BULK_REQUESTS': {
        const { requests, user } = action.payload;
        const newRequests: PromotionRequest[] = requests.map((request, index) => ({
            ...request,
            id: `req-${Date.now()}-${index}`,
            createdAt: new Date().toISOString(),
            status: RequestStatus.PENDENTE,
            requesterId: user.id,
            auditLog: [createLog(user, 'Criação da Solicitação (Em Massa)')],
        } as PromotionRequest));
        return { ...state, requests: [...state.requests, ...newRequests] };
    }
    case 'UPDATE_REQUEST': {
        const { request, user, isModification } = action.payload;
        return {
            ...state,
            requests: state.requests.map(r => {
                if (r.id === request.id) {
                    const updatedRequest = { ...r, ...request };
                    if (isModification) {
                        updatedRequest.status = RequestStatus.PENDENTE;
                        updatedRequest.auditLog = [...r.auditLog, createLog(user, 'Solicitação de Modificação')];
                    } else {
                        updatedRequest.auditLog = [...r.auditLog, createLog(user, 'Edição da Solicitação')];
                    }
                    return updatedRequest;
                }
                return r;
            })
        };
    }
    case 'UPDATE_REQUEST_STATUS': {
        const { id, status, reason, approver } = action.payload;
        return {
            ...state,
            requests: state.requests.map(r => {
                if (r.id === id) {
                    const actionText = status === RequestStatus.APROVADA ? 'Aprovada' : 'Reprovada';
                    const newLog = createLog(approver, actionText, reason);
                    return {
                        ...r,
                        status,
                        approverName: approver.name,
                        approvalDate: status === RequestStatus.APROVADA ? new Date().toISOString() : r.approvalDate,
                        rejectionReason: status === RequestStatus.REPROVADA ? reason : undefined,
                        auditLog: [...r.auditLog, newLog],
                    };
                }
                return r;
            })
        };
    }
    case 'UPDATE_BULK_REQUEST_STATUS': {
        const { decisions, approver } = action.payload;
        const decisionMap = new Map(decisions.map(d => [d.id, d]));

        return {
            ...state,
            requests: state.requests.map(r => {
                if (decisionMap.has(r.id)) {
                    const decision = decisionMap.get(r.id)!;
                    const actionText = decision.status === RequestStatus.APROVADA ? 'Aprovada (Em Massa)' : 'Reprovada (Em Massa)';
                    const details = decision.status === RequestStatus.REPROVADA ? decision.reason : `Num. Ação SAP: ${decision.sapActionNumber || 'N/A'}`;
                    const newLog = createLog(approver, actionText, details);
                    
                    return {
                        ...r,
                        status: decision.status,
                        approverName: approver.name,
                        approvalDate: new Date().toISOString(),
                        rejectionReason: decision.status === RequestStatus.REPROVADA ? decision.reason : undefined,
                        sapActionNumber: decision.status === RequestStatus.APROVADA ? decision.sapActionNumber : undefined,
                        auditLog: [...r.auditLog, newLog],
                    };
                }
                return r;
            })
        };
    }
    case 'CANCEL_REQUEST': {
        const { id, reason, canceller } = action.payload;
         return {
            ...state,
            requests: state.requests.map(r => {
                if (r.id === id) {
                    return {
                        ...r,
                        status: RequestStatus.CANCELADA,
                        auditLog: [...r.auditLog, createLog(canceller, 'Cancelamento', reason)],
                    };
                }
                return r;
            })
        };
    }
    case 'ADD_SKU_FAMILY':
        // FIX: The spread operator was being used on the entire state object instead of the skuFamilies array.
        return { ...state, skuFamilies: [...state.skuFamilies, action.payload] };
    case 'UPDATE_SKU_FAMILY':
        return { ...state, skuFamilies: state.skuFamilies.map(f => f.id === action.payload.id ? action.payload : f) };
    case 'DELETE_SKU_FAMILY':
        return { ...state, skuFamilies: state.skuFamilies.filter(f => f.id !== action.payload) };
    case 'ADD_STORE_GROUP':
        return { ...state, storeGroups: [...state.storeGroups, action.payload] };
    case 'UPDATE_STORE_GROUP':
        return { ...state, storeGroups: state.storeGroups.map(g => g.id === action.payload.id ? action.payload : g) };
    case 'DELETE_STORE_GROUP':
        return { ...state, storeGroups: state.storeGroups.filter(g => g.id !== action.payload) };
    case 'UPDATE_RULES':
        return { ...state, rules: { ...state.rules, ...action.payload } };
    case 'UPLOAD_DIFFUSION_VOLUME':
        return { ...state, diffusionVolumeLastUpload: new Date().toISOString() };
    case 'UPDATE_USER': {
        const updatedUser = action.payload;
        return {
            ...state,
            users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
            // Also update currentUser if it's the one being edited
            currentUser: state.currentUser.id === updatedUser.id ? updatedUser : state.currentUser
        };
    }
    default:
      return state;
  }
};

interface AppContextProps {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextProps>({
  state: initialState,
  dispatch: () => null,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);