// Implementing the Rules Management page to view and update business rules.
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, Button, Input } from '../components/ui';
import { Rules } from '../types';

const RulesManagement: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [rules, setRules] = useState<Rules>(state.rules);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setRules(state.rules);
        setHasChanges(false);
    }, [state.rules]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRules({ ...rules, [e.target.name]: Number(e.target.value) });
        setHasChanges(true);
    };

    const handleSave = () => {
        dispatch({ type: 'UPDATE_RULES', payload: rules });
        setHasChanges(false);
        alert('Regras salvas com sucesso!');
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Gerenciar Regras de Negócio</h2>
            
            <Card>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6 max-w-lg mx-auto">
                    <div>
                        <Input 
                            label="Desconto Máximo Permitido (%)"
                            id="maxDiscountPercentage"
                            type="number"
                            name="maxDiscountPercentage"
                            value={rules.maxDiscountPercentage}
                            onChange={handleChange}
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">O percentual máximo de desconto que pode ser aplicado em uma única promoção.</p>
                    </div>
                    <div>
                        <Input 
                            label="Tempo Mínimo Entre Solicitações (horas)"
                            id="minTimeBetweenRequests"
                            type="number"
                            name="minTimeBetweenRequests"
                            value={rules.minTimeBetweenRequests}
                            onChange={handleChange}
                        />
                         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">O tempo mínimo em horas que um mesmo produto pode ter uma nova promoção solicitada.</p>
                    </div>
                     <div>
                        <Input 
                            label="Limite de Volume Diário de Promoções"
                            id="dailyVolumeLimit"
                            type="number"
                            name="dailyVolumeLimit"
                            value={rules.dailyVolumeLimit}
                            onChange={handleChange}
                        />
                         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Número máximo de promoções que podem iniciar em um mesmo dia da semana.</p>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={!hasChanges}>
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default RulesManagement;
