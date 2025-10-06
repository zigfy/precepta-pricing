// Implementing the main Dashboard page with request list, filters, and modals.
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Modal, Button, Select, Input } from '../components/ui';
import RequestListItem from '../components/RequestListItem';
import RequestFormModal from '../components/RequestFormModal';
import { PromotionRequest, RequestStatus, UserRole, hasPermission, Permission } from '../types';
import { PlusIcon, DocumentArrowUpIcon, ArrowDownTrayIcon, UploadIcon } from '../components/icons';
import { STATUS_CONFIG } from '../constants';

declare var XLSX: any; // For SheetJS library

const Dashboard: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { requests, currentUser, users } = state;

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isModificationMode, setIsModificationMode] = useState(false);
    
    const [selectedRequest, setSelectedRequest] = useState<PromotionRequest | null>(null);
    const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');

    const canCreateRequest = currentUser.role === UserRole.ANALISTA_COMERCIAL;
    const canApproveRequest = hasPermission(currentUser, Permission.APPROVE_REQUESTS);
    const canBulkUpload = hasPermission(currentUser, Permission.BULK_UPLOAD_REQUESTS);
    
    const getEffectiveStatus = (request: PromotionRequest): RequestStatus => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(request.startDate + 'T00:00:00');
        const endDate = new Date(request.endDate + 'T00:00:00');
    
        if (request.status === RequestStatus.APROVADA) {
            if (today > endDate) return RequestStatus.FINALIZADA;
            if (today >= startDate && today <= endDate) return RequestStatus.ATIVA;
        }
        return request.status;
    };

    const openFormModal = (request: PromotionRequest | null = null, modification = false) => {
        setSelectedRequest(request);
        setIsModificationMode(modification);
        setIsFormModalOpen(true);
        setIsDetailsModalOpen(false);
    };

    const openDetailsModal = (request: PromotionRequest) => {
        setSelectedRequest(request);
        setIsDetailsModalOpen(true);
    };
    
    const openCancelModal = (request: PromotionRequest) => {
        setSelectedRequest(request);
        setIsCancelModalOpen(true);
        setIsDetailsModalOpen(false);
    };

    const closeModal = () => {
        setIsFormModalOpen(false);
        setIsDetailsModalOpen(false);
        setIsCancelModalOpen(false);
        setSelectedRequest(null);
        setRejectionReason('');
        setCancellationReason('');
        setIsModificationMode(false);
    };

    const handleStatusUpdate = (status: RequestStatus) => {
        if (!selectedRequest) return;
        if (status === RequestStatus.REPROVADA && !rejectionReason.trim()) {
            alert('Por favor, informe o motivo da reprovação.');
            return;
        }
        dispatch({
            type: 'UPDATE_REQUEST_STATUS',
            payload: {
                id: selectedRequest.id,
                status,
                approver: currentUser,
                reason: rejectionReason,
            }
        });
        closeModal();
    };
    
    const handleCancelSubmit = () => {
        if (!selectedRequest) return;
        if (!cancellationReason.trim()) {
            alert('Por favor, informe o motivo do cancelamento.');
            return;
        }
        dispatch({
            type: 'CANCEL_REQUEST',
            payload: {
                id: selectedRequest.id,
                reason: cancellationReason,
                canceller: currentUser,
            }
        });
        closeModal();
    };

    const handleExport = () => {
        const pendingRequests = requests.filter(r => r.status === RequestStatus.PENDENTE);
        if (pendingRequests.length === 0) {
            alert("Não há solicitações pendentes para exportar.");
            return;
        }
    
        const dataToExport = pendingRequests.map(r => {
            const requester = users.find(u => u.id === r.requesterId);
            return {
                promotionRequestId: r.id,
                sku: r.sku,
                description: r.description,
                priceFrom: r.priceFrom,
                priceTo: r.priceTo,
                startDate: r.startDate,
                endDate: r.endDate,
                requesterName: requester?.name || 'Desconhecido',
                storeGroupId: r.storeGroupId || 'Todas as Lojas',
                hasRebate: r.hasRebate ? 'SIM' : 'NÃO',
                rebateValue: r.rebateValue || 0,
                commercialObservation: r.commercialObservation || '',
                // Columns for the analyst to fill
                statusDaDecisao: '',
                motivoRejeicao: '',
                numeroAcaoSAP: '',
            };
        });
    
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Decisoes_Pendentes");
        const today = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `pendentes_analise_${today}.xlsx`);
    };
    
    const filteredRequests = useMemo(() => {
        let roleFilteredRequests = requests;

        if (currentUser.role === UserRole.ANALISTA_COMERCIAL) {
            roleFilteredRequests = requests.filter(r => r.requesterId === currentUser.id);
        } else if (currentUser.role === UserRole.GESTOR_COMERCIAL) {
            const teamMemberIds = users.filter(u => u.managerId === currentUser.id).map(u => u.id);
            roleFilteredRequests = requests.filter(r => teamMemberIds.includes(r.requesterId));
        }

        return roleFilteredRequests
            .map(r => ({ ...r, effectiveStatus: getEffectiveStatus(r) }))
            .filter(r => statusFilter === 'ALL' || r.effectiveStatus === statusFilter)
            .filter(r => 
                r.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                r.sku.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [requests, statusFilter, searchTerm, currentUser, users]);


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                 <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard de Promoções</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    {canApproveRequest && (
                        <>
                            <Button variant="secondary" onClick={handleExport}>
                                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                                Exportar Pendentes
                            </Button>
                            <Link to="/mass-approval">
                                <Button variant="secondary">
                                    <UploadIcon className="w-5 h-5 mr-2" />
                                    Importar Decisões
                                </Button>
                            </Link>
                        </>
                    )}
                    {canBulkUpload && (
                         <Link to="/bulk-upload">
                            <Button variant="secondary">
                                <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                                Importar Novas Solicitações
                            </Button>
                        </Link>
                    )}
                    {canCreateRequest && (
                        <Button onClick={() => openFormModal()}>
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Nova Solicitação
                        </Button>
                    )}
                </div>
            </div>

            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center space-x-4">
                <Input 
                    placeholder="Buscar por SKU ou descrição..."
                    className="flex-grow"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'ALL')}
                    className="w-48"
                >
                    <option value="ALL">Todos os Status</option>
                    {Object.entries(STATUS_CONFIG).map(([key, value]) => (
                        <option key={key} value={key}>{value.text}</option>
                    ))}
                </Select>
            </div>

            <div>
                {filteredRequests.length > 0 ? (
                    filteredRequests.map(request => (
                        <RequestListItem 
                            key={request.id} 
                            request={{...request, status: request.effectiveStatus}}
                            onViewDetails={() => openDetailsModal(request)}
                        />
                    ))
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500 dark:text-gray-400">Nenhuma solicitação encontrada.</p>
                    </div>
                )}
            </div>

            {isFormModalOpen && (
                 <RequestFormModal
                    isOpen={isFormModalOpen}
                    onClose={closeModal}
                    request={selectedRequest}
                    isModification={isModificationMode}
                />
            )}

            {isDetailsModalOpen && selectedRequest && (() => {
                const effectiveStatus = getEffectiveStatus(selectedRequest);
                const requester = users.find(u => u.id === selectedRequest.requesterId);
                const isOwner = currentUser.id === selectedRequest.requesterId;
                const isActionable = (effectiveStatus === RequestStatus.ATIVA || effectiveStatus === RequestStatus.APROVADA) && isOwner;

                return (
                <Modal isOpen={isDetailsModalOpen} onClose={closeModal} title="Detalhes da Solicitação">
                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedRequest.description}</h3>
                        <p><span className="font-semibold">SKU:</span> {selectedRequest.sku}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <p><span className="font-semibold">De:</span> <span className="line-through">R$ {selectedRequest.priceFrom.toFixed(2)}</span></p>
                            <p><span className="font-semibold">Por:</span> <span className="text-primary-600 font-bold">R$ {selectedRequest.priceTo.toFixed(2)}</span></p>
                            {/* FIX: Changed toLocaleDateDateString to toLocaleDateString. */}
                            <p><span className="font-semibold">Início:</span> {new Date(selectedRequest.startDate + 'T00:00:00').toLocaleDateString()}</p>
                            {/* FIX: Changed toLocaleDateDateString to toLocaleDateString. */}
                            <p><span className="font-semibold">Fim:</span> {new Date(selectedRequest.endDate + 'T00:00:00').toLocaleDateString()}</p>
                        </div>
                        <p><span className="font-semibold">Status:</span> 
                            <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CONFIG[effectiveStatus].color} ${STATUS_CONFIG[effectiveStatus].bgColor}`}>
                                {STATUS_CONFIG[effectiveStatus].text}
                            </span>
                        </p>
                        <p><span className="font-semibold">Solicitante:</span> {requester?.name || 'Desconhecido'}</p>
                        <p><span className="font-semibold">Data da Solicitação:</span> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                        
                        {(selectedRequest.hasRebate || selectedRequest.commercialObservation) && <hr className="dark:border-gray-600"/>}

                        {selectedRequest.hasRebate && (
                            <p><span className="font-semibold">Rebate:</span> <span className="font-bold text-green-600">R$ {selectedRequest.rebateValue?.toFixed(2)}</span></p>
                        )}

                        {selectedRequest.commercialObservation && (
                            <div>
                                <p className="font-semibold">Observação Comercial:</p>
                                <p className="text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded-md">{selectedRequest.commercialObservation}</p>
                            </div>
                        )}

                        {selectedRequest.status !== RequestStatus.PENDENTE && (
                            <>
                                <hr className="dark:border-gray-600"/>
                                <p><span className="font-semibold">Aprovador/Revisor:</span> {selectedRequest.approverName}</p>
                                {selectedRequest.status === RequestStatus.APROVADA && selectedRequest.approvalDate &&
                                    <p><span className="font-semibold">Data da Aprovação:</span> {new Date(selectedRequest.approvalDate).toLocaleString()}</p>}
                                {selectedRequest.status === RequestStatus.REPROVADA && selectedRequest.rejectionReason &&
                                    <p><span className="font-semibold">Motivo da Reprovação:</span> {selectedRequest.rejectionReason}</p>}
                                {selectedRequest.sapActionNumber &&
                                    <p><span className="font-semibold">Num. Ação SAP:</span> {selectedRequest.sapActionNumber}</p>}
                            </>
                        )}
                        
                        <hr className="dark:border-gray-600 my-4"/>
                        <h4 className="font-semibold text-gray-800 dark:text-white">Histórico de Alterações</h4>
                        <ul className="space-y-2 text-sm max-h-40 overflow-y-auto">
                            {selectedRequest.auditLog.map(log => (
                                <li key={log.timestamp} className="text-gray-600 dark:text-gray-400">
                                    <span className="font-semibold">{new Date(log.timestamp).toLocaleString()}:</span> {log.user} ({log.role}) - <span className="font-medium text-gray-700 dark:text-gray-300">{log.action}</span>
                                    {log.details && <span className="italic"> - Detalhes: {log.details}</span>}
                                </li>
                            ))}
                        </ul>

                        {selectedRequest.status === RequestStatus.PENDENTE && canApproveRequest && (
                           <>
                             <hr className="dark:border-gray-600 my-4"/>
                             <h4 className="font-semibold text-gray-800 dark:text-white">Ações</h4>
                             <div className="space-y-2">
                                 <label htmlFor="rejectionReason" className="block text-sm font-medium">Motivo (para reprovação)</label>
                                 <Input 
                                     id="rejectionReason"
                                     value={rejectionReason}
                                     onChange={(e) => setRejectionReason(e.target.value)}
                                     placeholder="Ex: Margem muito baixa, conflito com outra campanha..."
                                 />
                             </div>
                           </>
                        )}
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        {selectedRequest.status === RequestStatus.PENDENTE && canApproveRequest ? (
                             <div className="flex-grow flex space-x-2" data-testid="approval-actions">
                                <Button variant="danger" onClick={() => handleStatusUpdate(RequestStatus.REPROVADA)}>Reprovar</Button>
                                <Button variant="success" onClick={() => handleStatusUpdate(RequestStatus.APROVADA)}>Aprovar</Button>
                             </div>
                        ) : isActionable ? (
                            <div className="flex-grow flex space-x-2">
                                <Button variant='secondary' onClick={() => openFormModal(selectedRequest, true)}>Modificar/Prorrogar</Button>
                                <Button variant='danger' onClick={() => openCancelModal(selectedRequest)}>Cancelar Promoção</Button>
                            </div>
                        ) : null}
                         <Button variant="secondary" onClick={closeModal}>Fechar</Button>
                    </div>
                </Modal>
            )})()}
            
            {isCancelModalOpen && selectedRequest && (
                 <Modal isOpen={isCancelModalOpen} onClose={closeModal} title="Cancelar Solicitação de Promoção">
                     <div className="space-y-4">
                        <p>Tem certeza que deseja solicitar o cancelamento da promoção <span className="font-bold">"{selectedRequest.description}"</span>?</p>
                        <div>
                            <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo do Cancelamento (obrigatório)</label>
                            <textarea
                                id="cancellationReason"
                                rows={3}
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Ex: Baixa adesão, erro de estratégia..."
                            />
                        </div>
                     </div>
                     <div className="flex justify-end pt-4 space-x-2" data-testid="cancel-actions">
                        <Button variant="secondary" onClick={closeModal}>Voltar</Button>
                        <Button variant="danger" onClick={handleCancelSubmit}>Confirmar Cancelamento</Button>
                     </div>
                </Modal>
            )}

        </div>
    );
};

export default Dashboard;