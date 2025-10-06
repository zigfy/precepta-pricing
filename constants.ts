// Creating the STATUS_CONFIG constant for request statuses.
import { RequestStatus } from './types';

export const STATUS_CONFIG: Record<RequestStatus, { text: string; color: string; bgColor: string }> = {
  [RequestStatus.PENDENTE]: {
    text: 'Pendente',
    color: 'text-yellow-800 dark:text-yellow-200',
    bgColor: 'bg-yellow-100 dark:bg-yellow-800/50',
  },
  [RequestStatus.APROVADA]: {
    text: 'Aprovada',
    color: 'text-blue-800 dark:text-blue-200',
    bgColor: 'bg-blue-100 dark:bg-blue-800/50',
  },
  [RequestStatus.REPROVADA]: {
    text: 'Reprovada',
    color: 'text-red-800 dark:text-red-200',
    bgColor: 'bg-red-100 dark:bg-red-800/50',
  },
  [RequestStatus.AJUSTE_NECESSARIO]: {
    text: 'Ajuste Necessário',
    color: 'text-orange-800 dark:text-orange-200',
    bgColor: 'bg-orange-100 dark:bg-orange-800/50',
  },
  [RequestStatus.MODIFICADA]: {
    text: 'Modificada',
    color: 'text-purple-800 dark:text-purple-200',
    bgColor: 'bg-purple-100 dark:bg-purple-800/50',
  },
  [RequestStatus.CANCELADA]: {
    text: 'Cancelada',
    color: 'text-gray-800 dark:text-gray-200',
    bgColor: 'bg-gray-200 dark:bg-gray-700',
  },
  [RequestStatus.ATIVA]: {
    text: 'Ativa',
    color: 'text-green-800 dark:text-green-200',
    bgColor: 'bg-green-100 dark:bg-green-800/50',
  },
  [RequestStatus.FINALIZADA]: {
    text: 'Finalizada',
    color: 'text-gray-800 dark:text-gray-200',
    bgColor: 'bg-gray-200 dark:bg-gray-700',
  },
};