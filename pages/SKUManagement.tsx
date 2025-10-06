import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, Button, Input, Modal } from '../components/ui';
import { PlusIcon, EditIcon, DeleteIcon } from '../components/icons';
import { SKUFamily } from '../types';

const SKUManagement: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { skuFamilies } = state;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentFamily, setCurrentFamily] = useState<Partial<SKUFamily> | null>(null);
    const [skusInput, setSkusInput] = useState('');

    useEffect(() => {
        if (isModalOpen && currentFamily) {
            setSkusInput(currentFamily.skus?.join(', ') || '');
        }
    }, [isModalOpen, currentFamily]);

    const openModal = (family: Partial<SKUFamily> | null = null) => {
        setCurrentFamily(family ? { ...family } : { name: '', skus: [] });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentFamily(null);
        setSkusInput('');
    };

    const handleSave = () => {
        if (!currentFamily || !currentFamily.name) {
            alert("O nome da família é obrigatório.");
            return;
        }

        const updatedSkus = skusInput.split(',').map(s => s.trim()).filter(Boolean);
        const familyToSave = { ...currentFamily, skus: updatedSkus };

        if (familyToSave.id) {
            dispatch({ type: 'UPDATE_SKU_FAMILY', payload: familyToSave as SKUFamily });
        } else {
            dispatch({ type: 'ADD_SKU_FAMILY', payload: { ...familyToSave, id: `fam-${Date.now()}` } as SKUFamily });
        }
        closeModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta família de SKU?")) {
            dispatch({ type: 'DELETE_SKU_FAMILY', payload: id });
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciar Famílias de SKU</h2>
                <Button onClick={() => openModal()}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nova Família
                </Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome da Família</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKUs Associados</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {skuFamilies.map((family) => (
                                <tr key={family.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{family.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <span title={family.skus.join(', ')}>{family.skus.slice(0, 5).join(', ')}{family.skus.length > 5 ? '...' : ''}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openModal(family)} className="text-primary-600 hover:text-primary-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(family.id)} className="text-red-600 hover:text-red-900"><DeleteIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={closeModal} title={currentFamily?.id ? "Editar Família" : "Nova Família"}>
                {currentFamily && (
                    <div className="space-y-4">
                        <Input 
                            label="Nome da Família" 
                            value={currentFamily.name || ''} 
                            onChange={(e) => setCurrentFamily({...currentFamily, name: e.target.value})} 
                        />
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKUs (separados por vírgula)</label>
                            <textarea
                                rows={5}
                                value={skusInput}
                                onChange={(e) => setSkusInput(e.target.value)}
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

export default SKUManagement;