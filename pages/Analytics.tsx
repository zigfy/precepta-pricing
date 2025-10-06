
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { Card } from '../components/ui';
import { PromotionRequest, RequestStatus } from '../types';

const DataFreshnessIndicator: React.FC = () => {
    const { state } = useAppContext();
    const { diffusionVolumeLastUpload } = state;

    if (!diffusionVolumeLastUpload) {
        return (
             <Card className="bg-gray-100 dark:bg-gray-700">
                <h3 className="text-gray-500 dark:text-gray-400">Status dos Dados de Volume</h3>
                <p className="text-lg font-bold text-gray-600 dark:text-gray-300">Nenhuma carga de dados realizada.</p>
            </Card>
        );
    }
    
    const lastUploadDate = new Date(diffusionVolumeLastUpload);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    const isToday = lastUploadDate.toDateString() === today.toDateString();
    const isYesterday = lastUploadDate.toDateString() === yesterday.toDateString();
    
    let statusText = `Última carga em ${lastUploadDate.toLocaleDateString()}`;
    let bgColor = 'bg-red-100 dark:bg-red-900/50';
    let textColor = 'text-red-600 dark:text-red-300';
    let label = 'Atenção: Dados desatualizados';

    if (isToday) {
        statusText = "Dados atualizados hoje";
        bgColor = 'bg-green-100 dark:bg-green-900/50';
        textColor = 'text-green-600 dark:text-green-300';
        label = 'Status dos Dados de Volume';
    } else if (isYesterday) {
        statusText = "Dados atualizados ontem";
        bgColor = 'bg-yellow-100 dark:bg-yellow-900/50';
        textColor = 'text-yellow-600 dark:text-yellow-300';
        label = 'Status dos Dados de Volume';
    }
    
    return (
        <Card className={bgColor}>
            <h3 className="text-gray-500 dark:text-gray-400">{label}</h3>
            <p className={`text-xl font-bold ${textColor}`}>{statusText}</p>
        </Card>
    );
};


const Analytics: React.FC = () => {
    const { state } = useAppContext();
    const { requests, rules } = state;

    const analyticsData = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const activeToday = requests.filter(r => r.status === RequestStatus.APROVADA && r.startDate <= today && r.endDate >= today);
        const pending = requests.filter(r => r.status === RequestStatus.PENDENTE);
        const rejectedThisMonth = requests.filter(r => {
            if (r.status !== RequestStatus.REPROVADA) return false;
            const requestDate = new Date(r.createdAt);
            const todayDate = new Date();
            return requestDate.getMonth() === todayDate.getMonth() && requestDate.getFullYear() === todayDate.getFullYear();
        });
        
        const approvedRequests = requests.filter(r => r.status === RequestStatus.APROVADA);
        const totalDiscountValue = approvedRequests.reduce((sum, r) => sum + (r.priceFrom - r.priceTo), 0);
        const totalOriginalValue = approvedRequests.reduce((sum, r) => sum + r.priceFrom, 0);
        
        const averageDiscountValue = approvedRequests.length > 0 ? totalDiscountValue / approvedRequests.length : 0;
        const averageDiscountPercentage = totalOriginalValue > 0 ? (totalDiscountValue / totalOriginalValue) * 100 : 0;

        return {
            activeTodayCount: activeToday.length,
            pendingCount: pending.length,
            rejectedThisMonthCount: rejectedThisMonth.length,
            averageDiscountValue,
            averageDiscountPercentage
        };
    }, [requests]);

    const dailyVolumeData = useMemo(() => {
        const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const volume = weekdays.map(day => ({ name: day, promotions: 0 }));

        requests.forEach(req => {
            if (req.startDate) {
                const startDate = new Date(req.startDate + 'T00:00:00');
                volume[startDate.getDay()].promotions += 1;
            }
        });
        return volume;
    }, [requests]);

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <Card>
                    <h3 className="text-gray-500 dark:text-gray-400">Promoções Ativas Hoje</h3>
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{analyticsData.activeTodayCount}</p>
                </Card>
                <Card>
                    <h3 className="text-gray-500 dark:text-gray-400">Pendentes de Aprovação</h3>
                    <p className="text-3xl font-bold text-yellow-500">{analyticsData.pendingCount}</p>
                </Card>
                 <Card>
                    <h3 className="text-gray-500 dark:text-gray-400">Desconto Médio</h3>
                    <p className="text-3xl font-bold text-green-500">R$ {analyticsData.averageDiscountValue.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">({analyticsData.averageDiscountPercentage.toFixed(2)}%)</p>
                </Card>
                <Card>
                    <h3 className="text-gray-500 dark:text-gray-400">Reprovadas (Mês)</h3>
                    <p className="text-3xl font-bold text-red-500">{analyticsData.rejectedThisMonthCount}</p>
                </Card>
                <DataFreshnessIndicator />
            </div>

            <Card>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">CRÍTICO: Volume de Promoções por Dia de Início</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Alerta visual se o número de promoções para qualquer dia da semana ultrapassar o limite de {rules.dailyVolumeLimit}.</p>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={dailyVolumeData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="promotions" name="Nº de Promoções">
                                {dailyVolumeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.promotions > rules.dailyVolumeLimit ? '#ef4444' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default Analytics;