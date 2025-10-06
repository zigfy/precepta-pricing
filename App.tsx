// Setting up the main App component with routing and layout.
import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import SKUManagement from './pages/SKUManagement';
import StoreGroupManagement from './pages/StoreGroupManagement';
import RulesManagement from './pages/RulesManagement';
import Settings from './pages/Settings';
import DataUpload from './pages/DataUpload';
import UserManagement from './pages/UserManagement';
import BulkUpload from './pages/BulkUpload';
import MassApproval from './pages/MassApproval';
import { useAppContext } from './context/AppContext';
import { Permission, hasPermission } from './types';

const PageHeader: React.FC = () => {
    const location = useLocation();
    
    const getTitle = (path: string): string => {
        switch (path) {
            case '/': return 'Dashboard de Promoções';
            case '/analytics': return 'Analytics';
            case '/skus': return 'Gerenciar Famílias de SKU';
            case '/store-groups': return 'Gerenciar Grupos de Lojas';
            case '/rules': return 'Gerenciar Regras de Negócio';
            case '/settings': return 'Configurações';
            case '/data-upload': return 'Carga de Dados';
            case '/user-management': return 'Gestão de Usuários';
            case '/bulk-upload': return 'Importação de Solicitações em Massa';
            case '/mass-approval': return 'Aprovação de Decisões em Massa';
            default: return 'Sistema de Promoções';
        }
    }
    const title = getTitle(location.pathname);
    return <Header title={title} />;
}

interface ProtectedRouteProps {
    permission: Permission;
    children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ permission, children }) => {
    const { state } = useAppContext();
    if (!hasPermission(state.currentUser, permission)) {
        return <Navigate to="/" replace />;
    }
    return children;
}


const App: React.FC = () => {
    return (
        <Router>
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <PageHeader />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/analytics" element={<ProtectedRoute permission={Permission.VIEW_ANALYTICS}><Analytics /></ProtectedRoute>} />
                            <Route path="/skus" element={<ProtectedRoute permission={Permission.MANAGE_SKUS}><SKUManagement /></ProtectedRoute>} />
                            <Route path="/store-groups" element={<ProtectedRoute permission={Permission.MANAGE_STORE_GROUPS}><StoreGroupManagement /></ProtectedRoute>} />
                            <Route path="/rules" element={<ProtectedRoute permission={Permission.MANAGE_RULES}><RulesManagement /></ProtectedRoute>} />
                            <Route path="/data-upload" element={<ProtectedRoute permission={Permission.DATA_UPLOAD}><DataUpload /></ProtectedRoute>} />
                            <Route path="/user-management" element={<ProtectedRoute permission={Permission.MANAGE_USERS}><UserManagement /></ProtectedRoute>} />
                             <Route path="/bulk-upload" element={<ProtectedRoute permission={Permission.BULK_UPLOAD_REQUESTS}><BulkUpload /></ProtectedRoute>} />
                             <Route path="/mass-approval" element={<ProtectedRoute permission={Permission.APPROVE_REQUESTS}><MassApproval /></ProtectedRoute>} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </Router>
    );
};

export default App;