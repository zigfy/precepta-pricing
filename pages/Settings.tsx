// Creating a placeholder Settings page.
import React from 'react';
import { Card } from '../components/ui';

const Settings: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Configurações</h2>

      <Card>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preferências de Conta</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Esta seção está em desenvolvimento. Em breve você poderá gerenciar suas notificações,
          idioma e outras configurações de conta aqui.
        </p>
      </Card>
    </div>
  );
};

export default Settings;
