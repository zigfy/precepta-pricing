import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, Button, Select, Modal } from '../components/ui';
import { User, UserRole, Permission } from '../types';
import { EditIcon } from '../components/icons';

const UserManagement: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { users } = state;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const openModal = (user: User) => {
        setSelectedUser({ ...user }); // Create a copy to edit
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleSave = () => {
        if (selectedUser) {
            dispatch({ type: 'UPDATE_USER', payload: selectedUser });
            closeModal();
        }
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (selectedUser) {
            setSelectedUser({ ...selectedUser, role: e.target.value as UserRole });
        }
    };

    const handleManagerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (selectedUser) {
            setSelectedUser({ ...selectedUser, managerId: parseInt(e.target.value) || undefined });
        }
    }

    const handlePermissionChange = (permission: Permission, checked: boolean) => {
        if (selectedUser) {
            const currentPermissions = selectedUser.permissions || [];
            let newPermissions: Permission[];
            if (checked) {
                newPermissions = [...currentPermissions, permission];
            } else {
                newPermissions = currentPermissions.filter(p => p !== permission);
            }
            setSelectedUser({ ...selectedUser, permissions: newPermissions });
        }
    };
    
    const managers = users.filter(u => u.role === UserRole.GESTOR_COMERCIAL);

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Gestão de Usuários e Permissões</h2>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Função (Role)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Gestor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Permissões Extras</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map((user) => {
                                const manager = users.find(u => u.id === user.managerId);
                                return (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{manager?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.permissions?.length || 0}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openModal(user)} className="text-primary-600 hover:text-primary-900">
                                            <EditIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={closeModal} title={`Editar Usuário: ${selectedUser?.name}`}>
                {selectedUser && (
                    <div className="space-y-6">
                        <Select label="Função (Role)" value={selectedUser.role} onChange={handleRoleChange}>
                            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                        </Select>
                        
                        {selectedUser.role === UserRole.ANALISTA_COMERCIAL && (
                            <Select label="Gestor Comercial" value={selectedUser.managerId || ''} onChange={handleManagerChange}>
                                <option value="">Nenhum</option>
                                {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </Select>
                        )}

                        <div>
                            <h4 className="text-md font-medium text-gray-800 dark:text-white mb-2">Permissões Individuais (Overrides)</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(Permission).map(p => (
                                    <label key={p} className="flex items-center space-x-2">
                                        <input 
                                            type="checkbox"
                                            className="rounded text-primary-600 focus:ring-primary-500"
                                            checked={selectedUser.permissions?.includes(p) || false}
                                            onChange={(e) => handlePermissionChange(p, e.target.checked)}
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{p}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                           <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
                           <Button onClick={handleSave}>Salvar</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement;