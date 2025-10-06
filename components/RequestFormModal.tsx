// Implementing the RequestFormModal component for creating/editing promotion requests.
import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Select } from './ui';
import { PromotionRequest, RequestStatus } from '../types';
import { useAppContext } from '../context/AppContext';

interface RequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PromotionRequest | null;
  isModification?: boolean;
}

const RequestFormModal: React.FC<RequestFormModalProps> = ({ isOpen, onClose, request, isModification = false }) => {
  const { state, dispatch } = useAppContext();
  const { currentUser, storeGroups } = state;
  const [formData, setFormData] = useState<Partial<PromotionRequest>>({});

  useEffect(() => {
    if (isOpen) {
        if (request) {
          setFormData(request);
        } else {
          setFormData({
            status: RequestStatus.PENDENTE,
            requesterId: currentUser.id,
            hasRebate: false,
          });
        }
    }
  }, [request, currentUser, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
       setFormData(prev => ({ 
           ...prev, 
           [name]: checked,
           // Reset rebateValue if rebate is disabled
           ...(name === 'hasRebate' && !checked && { rebateValue: undefined })
        }));
    } else {
       setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (request) {
      dispatch({ type: 'UPDATE_REQUEST', payload: { request: formData as PromotionRequest, user: currentUser, isModification } });
    } else {
      dispatch({ type: 'ADD_REQUEST', payload: { request: formData, user: currentUser } });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isModification ? 'Solicitar Modificação de Promoção' : (request ? 'Editar Solicitação' : 'Nova Solicitação de Promoção')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="sku" label="SKU do Produto" value={formData.sku || ''} onChange={handleChange} required disabled={isModification} />
        <Input name="description" label="Descrição da Promoção" value={formData.description || ''} onChange={handleChange} required />
        <div className="grid grid-cols-2 gap-4">
            <Input name="priceFrom" label="Preço De (R$)" type="number" step="0.01" value={formData.priceFrom || ''} onChange={handlePriceChange} required />
            <Input name="priceTo" label="Preço Por (R$)" type="number" step="0.01" value={formData.priceTo || ''} onChange={handlePriceChange} required />
        </div>
         <div className="grid grid-cols-2 gap-4">
            <Input name="startDate" label="Data de Início" type="date" value={formData.startDate || ''} onChange={handleChange} required />
            <Input name="endDate" label="Data de Fim" type="date" value={formData.endDate || ''} onChange={handleChange} required />
        </div>
         <Select name="storeGroupId" label="Grupo de Lojas (Opcional)" value={formData.storeGroupId || ''} onChange={handleChange}>
            <option value="">Todas as Lojas</option>
            {storeGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
        </Select>

        <hr className="dark:border-gray-600 my-2"/>
        
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                 <input 
                    type="checkbox"
                    id="hasRebate"
                    name="hasRebate"
                    className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                    checked={formData.hasRebate || false}
                    onChange={handleChange}
                />
                <label htmlFor="hasRebate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Inclui Rebate?</label>
            </div>
           
            {formData.hasRebate && (
                 <Input 
                    name="rebateValue" 
                    label="Valor do Rebate (R$)" 
                    type="number" 
                    step="0.01" 
                    value={formData.rebateValue || ''} 
                    onChange={handlePriceChange} 
                    required 
                />
            )}
            
            <div>
                <label htmlFor="commercialObservation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observação Comercial (Opcional)</label>
                <textarea
                    id="commercialObservation"
                    name="commercialObservation"
                    rows={3}
                    value={formData.commercialObservation || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: Ação para o Dia dos Pais, queima de estoque..."
                />
            </div>
        </div>

        <div className="flex justify-end pt-4 space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestFormModal;