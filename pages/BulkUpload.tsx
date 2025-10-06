// Implementing a robust, multi-step bulk upload feature with validation and Brazilian number format support.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { UploadIcon, DocumentArrowUpIcon } from '../components/icons';
import { useAppContext } from '../context/AppContext';
import { PromotionRequest } from '../types';

type CsvRow = { [key: string]: string };
interface InvalidRow {
  rowNumber: number;
  data: CsvRow;
  error: string;
}

/**
 * A robust CSV row parser that handles commas within quoted fields.
 * @param row The string for a single CSV row.
 * @returns An array of strings representing the columns.
 */
const parseCsvRow = (row: string): string[] => {
    const result: string[] = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            if (inQuotes && row[i + 1] === '"') { // Handle escaped quote ""
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(currentField);
            currentField = '';
        } else {
            currentField += char;
        }
    }
    result.push(currentField); // Add the last field
    return result;
};


/**
 * Parses a string that may contain Brazilian number formatting (e.g., "1.297,99")
 * into a valid number for JavaScript processing.
 * @param numStr The string to parse.
 * @returns A number, or NaN if the input is invalid.
 */
const parseBrazilianNumber = (numStr: string | undefined): number => {
    if (!numStr || typeof numStr !== 'string') return NaN;
    const cleanedStr = numStr.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanedStr);
};

/**
 * Converts a date string from DD/MM/YYYY to YYYY-MM-DD (ISO) format.
 * Returns the original string if it's already in ISO format.
 * Returns an empty string for invalid formats.
 * @param dateStr The date string to convert.
 */
const convertDateToISO = (dateStr: string | undefined): string => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        if (day.length === 2 && month.length === 2 && year.length === 4) {
            return `${year}-${month}-${day}`;
        }
    }
    return ''; // Invalid format
};


const BulkUpload: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { currentUser, storeGroups } = state;
    const navigate = useNavigate();

    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
    const [isProcessing, setIsProcessing] = useState(false);

    const [validRequests, setValidRequests] = useState<Partial<PromotionRequest>[]>([]);
    const [invalidRows, setInvalidRows] = useState<InvalidRow[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setStep('upload');
        setValidRequests([]);
        setInvalidRows([]);
        setFileError(null);
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
                setFile(selectedFile);
            } else {
                setFileError('Por favor, selecione um arquivo .csv válido.');
                setFile(null);
            }
        } else {
            setFile(null);
        }
    };

    const processFile = (csvText: string) => {
        setIsProcessing(true);
        try {
            const lines = csvText.trim().split(/\r\n|\n/);
            if (lines.length < 2) throw new Error("O arquivo CSV está vazio ou contém apenas o cabeçalho.");

            const headers = parseCsvRow(lines[0]).map(h => h.trim());
            const requiredHeaders = ['sku', 'description', 'priceFrom', 'priceTo', 'startDate', 'endDate'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                throw new Error(`Cabeçalhos obrigatórios não encontrados: ${missingHeaders.join(', ')}.`);
            }

            const localValid: Partial<PromotionRequest>[] = [];
            const localInvalid: InvalidRow[] = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // Skip empty lines

                const values = parseCsvRow(line);
                if (values.length !== headers.length) {
                    localInvalid.push({ rowNumber: i + 1, data: { raw: line }, error: `Número de colunas incorreto. Esperado: ${headers.length}, Encontrado: ${values.length}.` });
                    continue;
                }

                const rowData: CsvRow = {};
                headers.forEach((header, index) => {
                    rowData[header] = values[index]?.trim();
                });
                
                // --- VALIDATION LOGIC ---
                const priceFromNum = parseBrazilianNumber(rowData.priceFrom);
                const priceToNum = parseBrazilianNumber(rowData.priceTo);
                const rebateValueNum = parseBrazilianNumber(rowData.rebateValue);
                const startDateIso = convertDateToISO(rowData.startDate);
                const endDateIso = convertDateToISO(rowData.endDate);

                let error = '';
                if (!rowData.sku || !rowData.description || !rowData.priceFrom || !rowData.priceTo || !rowData.startDate || !rowData.endDate) {
                    error = 'Campos obrigatórios (sku, description, prices, dates) faltando.';
                } else if (!startDateIso || !endDateIso) {
                    error = "Formato de data inválido. Use DD/MM/YYYY ou YYYY-MM-DD.";
                } else if (new Date(endDateIso) < new Date(startDateIso)) {
                    error = "A data final não pode ser anterior à data de início.";
                } else if (isNaN(priceFromNum) || isNaN(priceToNum)) {
                    error = "Valores de preço (priceFrom, priceTo) devem ser números válidos (ex: 1.297,99 ou 1297.99).";
                } else if (priceToNum >= priceFromNum) {
                    error = "Preço 'Por' (priceTo) deve ser menor que o 'De' (priceFrom).";
                } else if (rowData.storeGroupId && !storeGroups.some(g => g.id === rowData.storeGroupId)) {
                    error = `O Grupo de Lojas (storeGroupId) '${rowData.storeGroupId}' não existe.`;
                } else if (rowData.hasRebate?.toLowerCase() === 'true' && (isNaN(rebateValueNum) || rebateValueNum <= 0)) {
                    error = "Se hasRebate for 'true', rebateValue deve ser um número positivo e válido.";
                }

                if (error) {
                    localInvalid.push({ rowNumber: i + 1, data: rowData, error });
                } else {
                    localValid.push({
                        sku: rowData.sku,
                        description: rowData.description,
                        priceFrom: priceFromNum,
                        priceTo: priceToNum,
                        startDate: startDateIso,
                        endDate: endDateIso,
                        storeGroupId: rowData.storeGroupId || undefined,
                        hasRebate: rowData.hasRebate?.toLowerCase() === 'true',
                        rebateValue: rowData.hasRebate?.toLowerCase() === 'true' ? rebateValueNum : undefined,
                        commercialObservation: rowData.commercialObservation || undefined,
                    });
                }
            }

            setValidRequests(localValid);
            setInvalidRows(localInvalid);
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
        reader.onload = (e) => processFile(e.target?.result as string);
        reader.onerror = () => setFileError('Não foi possível ler o arquivo.');
        reader.readAsText(file, 'UTF-8');
    };

    const handleSubmit = () => {
        setIsProcessing(true);
        setTimeout(() => {
            dispatch({ type: 'ADD_BULK_REQUESTS', payload: { requests: validRequests, user: currentUser } });
            setIsProcessing(false);
            setStep('complete');
        }, 1000);
    };
    
    const handleDownloadTemplate = () => {
        const csvHeaders = "sku,description,priceFrom,priceTo,startDate,endDate,storeGroupId,hasRebate,rebateValue,commercialObservation";
        const exampleRow = `SKU123,"Promoção Dia das Mães, 20% OFF",199,99,149,99,01/05/2025,12/05/2025,grp-1,true,10.00,"Ação especial para alavancar vendas"`;
        const csvContent = `${csvHeaders}\n${exampleRow}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "template_promocoes.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const resetState = () => {
        setFile(null);
        setStep('upload');
        setValidRequests([]);
        setInvalidRows([]);
        setFileError(null);
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Importação em Massa</h2>

            <Card className="max-w-6xl mx-auto">
                {step === 'upload' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Passo 1: Baixar Template e Enviar Arquivo</h3>
                            <div className="mt-2 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                                <p className="text-sm text-primary-800 dark:text-primary-200">
                                    Para garantir que sua importação funcione, <button onClick={handleDownloadTemplate} className="font-bold underline hover:text-primary-600 dark:hover:text-primary-100">baixe o nosso template CSV com um exemplo</button>.
                                </p>
                                <p className="text-xs text-primary-700 dark:text-primary-300 mt-2">
                                    Formatos aceitos: Datas (DD/MM/YYYY ou YYYY-MM-DD), Preços (1.299,90 ou 1299.90).
                                </p>
                            </div>
                            <div className="mt-4 flex items-center space-x-4">
                                <label className="flex-grow w-full flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <UploadIcon className="w-5 h-5 text-gray-400 mr-2" />
                                    <span className="text-gray-700 dark:text-gray-300 truncate">
                                        {file?.name || 'Selecione um arquivo .csv'}
                                    </span>
                                    <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
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
                            <div className={`mt-2 p-4 rounded-lg flex justify-around text-center ${invalidRows.length > 0 ? 'bg-orange-50 dark:bg-orange-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">Total de Linhas Lidas</p>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{validRequests.length + invalidRows.length}</p>
                                </div>
                                 <div>
                                    <p className="text-sm text-green-700 dark:text-green-300">Solicitações Válidas</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{validRequests.length}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-red-700 dark:text-red-300">Linhas com Erros</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{invalidRows.length}</p>
                                </div>
                            </div>
                        </div>

                        {invalidRows.length > 0 && (
                             <div>
                                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">Detalhes dos Erros Encontrados</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Por favor, corrija os erros abaixo no seu arquivo CSV e tente o upload novamente. Somente as solicitações válidas serão importadas.</p>
                                <div className="border rounded-lg overflow-x-auto max-h-80">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Linha</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">SKU</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Motivo do Erro</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {invalidRows.map(row => (
                                                <tr key={row.rowNumber} className="bg-red-50 dark:bg-red-900/20">
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold">{row.rowNumber}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{row.data.sku || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-red-700 dark:text-red-300">{row.error}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                         <div className="flex justify-between items-center pt-4">
                            <Button onClick={resetState} variant="secondary">Voltar e Enviar Outro Arquivo</Button>
                            <Button onClick={handleSubmit} disabled={validRequests.length === 0 || isProcessing} variant="success" size="lg">
                                {isProcessing ? 'Importando...' : `Confirmar e Enviar ${validRequests.length} Solicitações Válidas`}
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
                        <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Importação Concluída com Sucesso!</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{validRequests.length} novas solicitações foram criadas e estão pendentes de aprovação.</p>
                        <div className="mt-6 flex justify-center space-x-4">
                            <Button onClick={resetState} variant="secondary">Importar Outro Arquivo</Button>
                            <Button onClick={() => navigate('/')} variant="primary">Ir para o Dashboard</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default BulkUpload;