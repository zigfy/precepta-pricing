// Implementing the Store Group Management page for CRUD operations on store groups.
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, Button, Input, Modal } from '../components/ui';
import { PlusIcon, EditIcon, DeleteIcon } from '../components/icons';
import { StoreGroup } from '../types';

const StoreGroupManagement: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { storeGroups } = state;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentGroup, setCurrentGroup] = useState<Partial<StoreGroup> | null>(null);
    const [storesInput, setStoresInput] = useState('');

    useEffect(() => {
        if (isModalOpen && currentGroup) {
            setStoresInput(currentGroup.stores?.join(', ') || '');
        }
    }, [isModalOpen, currentGroup]);


    const openModal = (group: Partial<StoreGroup> | null = null) => {
        setCurrentGroup(group ? { ...group } : { name: '', stores: [] });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentGroup(null);
        setStoresInput('');
    };

    const handleSave = () => {
        if (!currentGroup || !currentGroup.name) {
            alert("O nome do grupo é obrigatório.");
            return;
        }
        
        const updatedStores = storesInput.split(',').map(s => s.trim()).filter(Boolean);
        const groupToSave = { ...currentGroup, stores: updatedStores };

        if (groupToSave.id) {
            dispatch({ type: 'UPDATE_STORE_GROUP', payload: groupToSave as StoreGroup });
        } else {
            dispatch({ type: 'ADD_STORE_GROUP', payload: { ...groupToSave, id: `grp-${Date.now()}` } as StoreGroup });
        }
        closeModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este grupo de lojas?")) {
            dispatch({ type: 'DELETE_STORE_GROUP', payload: id });
        }
    };
    
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciar Grupos de Lojas</h2>
                <Button onClick={() => openModal()}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Novo Grupo
                </Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome do Grupo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lojas Associadas</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {storeGroups.map((group) => (
                                <tr key={group.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{group.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <span title={group.stores.join(', ')}>{group.stores.slice(0, 5).join(', ')}{group.stores.length > 5 ? '...' : ''}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openModal(group)} className="text-primary-600 hover:text-primary-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(group.id)} className="text-red-600 hover:text-red-900"><DeleteIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={closeModal} title={currentGroup?.id ? "Editar Grupo" : "Novo Grupo"}>
                {currentGroup && (
                    <div className="space-y-4">
                        <Input 
                            label="Nome do Grupo" 
                            value={currentGroup.name || ''} 
                            onChange={(e) => setCurrentGroup({...currentGroup, name: e.target.value})} 
                        />
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lojas (separadas por vírgula)</label>
                            <textarea
                                rows={5}
                                value={storesInput}
                                onChange={(e) => setStoresInput(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                           <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
                           <Button onClick={handleSave}>Salvar</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default StoreGroupManagement;