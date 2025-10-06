
import React from 'react';
import { PromotionRequest, RequestStatus } from '../types';
import { STATUS_CONFIG } from '../constants';
import { Card } from './ui';
import { useAppContext } from '../context/AppContext';

interface RequestListItemProps {
  request: PromotionRequest;
  onViewDetails: () => void;
}

const StatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.color} ${config.bgColor}`}>
      {config.text}
    </span>
  );
};

const RequestListItem: React.FC<RequestListItemProps> = ({ request, onViewDetails }) => {
  const { state } = useAppContext();
  const requester = state.users.find(u => u.id === request.requesterId);

  const timeSinceCreation = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos atrás";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses atrás";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " dias atrás";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas atrás";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutos atrás";
    return Math.floor(seconds) + " segundos atrás";
  };

  const isOldPending = request.status === RequestStatus.PENDENTE && (new Date().getTime() - new Date(request.createdAt).getTime()) > (2 * 24 * 60 * 60 * 1000);

  return (
    <Card 
        className={`mb-4 cursor-pointer hover:shadow-lg transition-shadow duration-200 ${isOldPending ? 'border-2 border-red-500' : ''}`}
        onClick={onViewDetails}
    >
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
        <div className="md:col-span-2">
          <p className="font-bold text-lg text-gray-800 dark:text-white">{request.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {request.sku}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">De</p>
          <p className="font-semibold text-gray-700 dark:text-gray-300 line-through">R$ {request.priceFrom.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Por</p>
          <p className="font-bold text-xl text-primary-600 dark:text-primary-400">R$ {request.priceTo.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
          <StatusBadge status={request.status} />
        </div>
        <div className="text-center md:text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Solicitante: {requester?.name || 'Desconhecido'}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{timeSinceCreation(request.createdAt)}</p>
        </div>
      </div>
    </Card>
  );
};

export default RequestListItem;