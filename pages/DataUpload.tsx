import React, { useState } from 'react';
import { Card, Button } from '../components/ui';
import { UploadIcon } from '../components/icons';
import { useAppContext } from '../context/AppContext';

interface FileUploadSectionProps {
  title: string;
  description: string;
  onUpload?: () => void;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({ title, description, onUpload }) => {
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFileName(event.target.files[0].name);
    } else {
      setFileName('');
    }
  };

  const handleUploadClick = () => {
    if (!fileName) {
        alert('Por favor, selecione um arquivo.');
        return;
    }
    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
        if(onUpload) {
            onUpload();
        }
        alert(`Arquivo "${fileName}" carregado com sucesso!`);
        setIsUploading(false);
        setFileName('');
    }, 1500);
  };

  return (
    <Card className="mb-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>
      <div className="flex items-center space-x-4">
        <label className="flex-grow w-full flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          <UploadIcon className="w-5 h-5 text-gray-400 mr-2" />
          <span className="text-gray-700 dark:text-gray-300 truncate">
            {fileName || 'Selecione um arquivo .csv'}
          </span>
          <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
        </label>
        <Button onClick={handleUploadClick} disabled={!fileName || isUploading}>
          {isUploading ? 'Carregando...' : 'Carregar'}
        </Button>
      </div>
    </Card>
  );
};

const DataUpload: React.FC = () => {
    const { dispatch } = useAppContext();

    const handleDiffusionUpload = () => {
        dispatch({ type: 'UPLOAD_DIFFUSION_VOLUME' });
    }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Carga de Dados</h2>

      <div className="max-w-4xl mx-auto">
        <FileUploadSection
          title="Upload da Tabela de Produtos"
          description="Carregue o arquivo CSV contendo a lista completa de produtos (SKU, descrição, preço base, etc.)."
        />
        <FileUploadSection
          title="Upload da Tabela de Lojas"
          description="Carregue o arquivo CSV com a base de lojas do sistema."
        />
        <FileUploadSection
          title="Upload da Tabela 'De/Para Compradores'"
          description="Carregue o arquivo CSV que mapeia compradores a hierarquias de categorias (N3, N4)."
        />
        <FileUploadSection
          title="Upload do 'Volume de Difusão' (Diário)"
          description="Carregue o arquivo diário com os dados para o gráfico de Volume de Promoções na tela de Analytics."
          onUpload={handleDiffusionUpload}
        />
      </div>
    </div>
  );
};

export default DataUpload;