// Creating the Sidebar component with role-based navigation.
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ChartBarIcon, TagIcon, CollectionIcon, ScaleIcon, CogIcon, UploadIcon, UsersIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import { UserRole, Permission, hasPermission } from '../types';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { state } = useAppContext();
  const { currentUser } = state;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: HomeIcon },
    { path: '/analytics', label: 'Analytics', icon: ChartBarIcon, permission: Permission.VIEW_ANALYTICS },
    { path: '/skus', label: 'Famílias SKU', icon: TagIcon, permission: Permission.MANAGE_SKUS },
    { path: '/store-groups', label: 'Grupos de Lojas', icon: CollectionIcon, permission: Permission.MANAGE_STORE_GROUPS },
    { path: '/rules', label: 'Regras', icon: ScaleIcon, permission: Permission.MANAGE_RULES },
    { path: '/data-upload', label: 'Carga de Dados', icon: UploadIcon, permission: Permission.DATA_UPLOAD },
    { path: '/user-management', label: 'Usuários', icon: UsersIcon, permission: Permission.MANAGE_USERS },
    { path: '/settings', label: 'Configurações', icon: CogIcon },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.permission || hasPermission(currentUser, item.permission)
  );
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex-col hidden md:flex">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">SIGAP</h2>
      </div>
      <nav className="flex-1 p-2 space-y-2">
        {filteredNavItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive(path)
                ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Icon className="w-6 h-6 mr-3" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 SIGAP Inc.</p>
      </div>
    </aside>
  );
};

export default Sidebar;