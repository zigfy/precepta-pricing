import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { UploadIcon } from '../components/icons';
import { useAppContext } from '../context/AppContext';
import { RequestStatus } from '../types';

declare var XLSX: any; // For SheetJS library

type DecisionRow = {
  promotionRequestId: string;
  statusDaDecisao: 'APROVADA' | 'REPROVADA' | string;
  motivoRejeicao?: string;
  numeroAcaoSAP?: string;
};

interface ValidatedDecision {
    id: string;
    status: RequestStatus;
    reason?: string;
    sapActionNumber?: string;
}

interface InvalidDecision {
  rowNumber: number;
  data: Partial<DecisionRow>;
  error: string;
}

const MassApproval: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { currentUser, requests } = state;
    const navigate = useNavigate();

    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
    const [isProcessing, setIsProcessing] = useState(false);

    const [validDecisions, setValidDecisions] = useState<ValidatedDecision[]>([]);
    const [invalidDecisions, setInvalidDecisions] = useState<InvalidDecision[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        resetState(false);
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            const allowedTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            if (allowedTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.xlsx')) {
                setFile(selectedFile);
            } else {
                setFileError('Por favor, selecione um arquivo .xlsx válido.');
                setFile(null);
            }
        } else {
            setFile(null);
        }
    };

    const processFile = (data: ArrayBuffer) => {
        setIsProcessing(true);
        try {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: DecisionRow[] = XLSX.utils.sheet_to_json(worksheet);

            if (json.length === 0) throw new Error("O arquivo Excel está vazio.");

            const requiredHeaders = ['promotionRequestId', 'statusDaDecisao'];
            const fileHeaders = Object.keys(json[0]);
            const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));
            if (missingHeaders.length > 0) {
                throw new Error(`Cabeçalhos obrigatórios não encontrados no arquivo: ${missingHeaders.join(', ')}.`);
            }

            const localValid: ValidatedDecision[] = [];
            const localInvalid: InvalidDecision[] = [];

            json.forEach((row, index) => {
                const { promotionRequestId, statusDaDecisao, motivoRejeicao, numeroAcaoSAP } = row;

                if (!promotionRequestId || !statusDaDecisao) {
                    localInvalid.push({ rowNumber: index + 2, data: row, error: "As colunas 'promotionRequestId' e 'statusDaDecisao' são obrigatórias." });
                    return;
                }

                const request = requests.find(r => r.id === promotionRequestId);
                if (!request) {
                    localInvalid.push({ rowNumber: index + 2, data: row, error: `Solicitação com ID '${promotionRequestId}' não encontrada.` });
                    return;
                }
                
                if (request.status !== RequestStatus.PENDENTE) {
                    localInvalid.push({ rowNumber: index + 2, data: row, error: `Esta solicitação já foi tratada (Status atual: ${request.status}).` });
                    return;
                }

                const decisionStatus = statusDaDecisao.toUpperCase();
                if (decisionStatus !== 'APROVADA' && decisionStatus !== 'REPROVADA') {
                    localInvalid.push({ rowNumber: index + 2, data: row, error: "O 'statusDaDecisao' deve ser 'APROVADA' ou 'REPROVADA'." });
                    return;
                }

                if (decisionStatus === 'REPROVADA' && (!motivoRejeicao || motivoRejeicao.trim() === '')) {
                     localInvalid.push({ rowNumber: index + 2, data: row, error: "O 'motivoRejeicao' é obrigatório quando a decisão é 'REPROVADA'." });
                    return;
                }

                localValid.push({
                    id: promotionRequestId,
                    status: decisionStatus === 'APROVADA' ? RequestStatus.APROVADA : RequestStatus.REPROVADA,
                    reason: motivoRejeicao,
                    sapActionNumber: numeroAcaoSAP,
                });
            });

            setValidDecisions(localValid);
            setInvalidDecisions(localInvalid);
            setStep('preview');

        } catch (err: any) {
            setFileError(err.message || 'Erro desconhecido ao processar o arquivo.');
            setStep('upload');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleProcessClick = () => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => processFile(e.target?.result as ArrayBuffer);
        reader.onerror = () => setFileError('Não foi possível ler o arquivo.');
        reader.readAsArrayBuffer(file);
    };
    
    const handleSubmit = () => {
        setIsProcessing(true);
        setTimeout(() => {
            dispatch({ type: 'UPDATE_BULK_REQUEST_STATUS', payload: { decisions: validDecisions, approver: currentUser } });
            setIsProcessing(false);
            setStep('complete');
        }, 1000);
    };

    const resetState = (goHome = false) => {
        setFile(null);
        setStep('upload');
        setValidDecisions([]);
        setInvalidDecisions([]);
        setFileError(null);
        if (goHome) navigate('/');
    };
    
    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Importação de Decisões em Massa</h2>
            <Card className="max-w-6xl mx-auto">
                 {step === 'upload' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Passo 1: Enviar Arquivo de Decisões</h3>
                             <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Faça o upload do arquivo <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">.xlsx</span> que você exportou e preencheu com as decisões de aprovação ou reprovação.
                            </p>
                            <div className="mt-4 flex items-center space-x-4">
                                <label className="flex-grow w-full flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <UploadIcon className="w-5 h-5 text-gray-400 mr-2" />
                                    <span className="text-gray-700 dark:text-gray-300 truncate">
                                        {file?.name || 'Selecione um arquivo .xlsx'}
                                    </span>
                                    <input type="file" className="hidden" accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} />
                                </label>
                            </div>
                            {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
                        </div>
                        <div className="flex justify-end pt-2">
                             <Button onClick={handleProcessClick} disabled={!file || isProcessing} variant="primary" size="lg">
                                {isProcessing ? 'Processando...' : 'Validar e Pré-visualizar'}
                            </Button>
                        </div>
                    </div>
                )}
                
                {step === 'preview' && (
                     <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Passo 2: Validação e Confirmação</h3>
                            <div className={`mt-2 p-4 rounded-lg flex justify-around text-center ${invalidDecisions.length > 0 ? 'bg-orange-50 dark:bg-orange-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">Total de Decisões Lidas</p>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{validDecisions.length + invalidDecisions.length}</p>
                                </div>
                                 <div>
                                    <p className="text-sm text-green-700 dark:text-green-300">Decisões Válidas</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{validDecisions.length}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-red-700 dark:text-red-300">Linhas com Erros</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{invalidDecisions.length}</p>
                                </div>
                            </div>
                        </div>

                        {invalidDecisions.length > 0 && (
                             <div>
                                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">Detalhes dos Erros Encontrados</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">As linhas com erro não serão processadas. Você pode continuar com as válidas ou corrigir o arquivo e tentar novamente.</p>
                                <div className="border rounded-lg overflow-x-auto max-h-80">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Linha (Excel)</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">ID da Solicitação</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Motivo do Erro</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {invalidDecisions.map(row => (
                                                <tr key={row.rowNumber} className="bg-red-50 dark:bg-red-900/20">
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold">{row.rowNumber}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{row.data.promotionRequestId || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-red-700 dark:text-red-300">{row.error}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                         <div className="flex justify-between items-center pt-4">
                            <Button onClick={() => resetState()} variant="secondary">Voltar e Enviar Outro Arquivo</Button>
                            <Button onClick={handleSubmit} disabled={validDecisions.length === 0 || isProcessing} variant="success" size="lg">
                                {isProcessing ? 'Processando...' : `Confirmar e Processar ${validDecisions.length} Decisões Válidas`}
                            </Button>
                        </div>
                    </div>
                )}
                
                {step === 'complete' && (
                    <div className="text-center py-10">
                         <div className="mx-auto bg-green-100 dark:bg-green-900/50 rounded-full h-16 w-16 flex items-center justify-center">
                            <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Processamento Concluído!</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{validDecisions.length} solicitações foram atualizadas com sucesso.</p>
                        <div className="mt-6 flex justify-center space-x-4">
                            <Button onClick={() => resetState()} variant="secondary">Importar Outro Arquivo</Button>
                            <Button onClick={() => resetState(true)} variant="primary">Ir para o Dashboard</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default MassApproval;