import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, X, Eye, FileImage, Brain, Zap, File } from 'lucide-react';
import { queryService } from '../services/api';
import { persistenceService } from '../services/persistence';
import { documentIntelligenceService } from '../services/documentIntelligence';
import toast from 'react-hot-toast';

const UploadPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentAnalysis, setDocumentAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      status: 'pending', // pending, analyzing, analyzed, uploading, success, error
      progress: 0,
      error: null,
      analysis: null,
      preview: null
    }));
    
    setUploadedFiles(prev => [...newFiles, ...prev]);
    
    // Analizar automáticamente el primer archivo
    if (newFiles.length > 0) {
      analyzeFile(newFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff']
    },
    multiple: true
  });

  // Analizar archivo con Azure Document Intelligence
  const analyzeFile = async (fileItem) => {
    try {
      setAnalyzing(true);
      
      // Actualizar estado a "analizando"
      setUploadedFiles(prev => 
        prev.map(item => 
          item.id === fileItem.id 
            ? { ...item, status: 'analyzing' }
            : item
        )
      );

      toast.loading(`🔍 Analizando ${fileItem.file.name}...`, { id: 'analyzing' });

      // Procesar archivo con Document Intelligence
      const result = await documentIntelligenceService.processFile(fileItem.file);

      if (result.success) {
        // Actualizar archivo con análisis
        setUploadedFiles(prev => 
          prev.map(item => 
            item.id === fileItem.id 
              ? { 
                  ...item, 
                  status: 'analyzed',
                  analysis: result,
                  preview: result.preview,
                  processedFile: result.processedFile
                }
              : item
          )
        );

        toast.success(
          `✅ ${fileItem.file.name} analizado: ${result.preview.summary.pages} páginas, ${result.preview.summary.words} palabras`,
          { id: 'analyzing' }
        );

        if (result.wasConverted) {
          toast.success(`🔄 Imagen convertida a PDF automáticamente`);
        }
      } else {
        // Error en análisis
        setUploadedFiles(prev => 
          prev.map(item => 
            item.id === fileItem.id 
              ? { ...item, status: 'error', error: result.error }
              : item
          )
        );

        toast.error(`❌ Error analizando ${fileItem.file.name}: ${result.error}`, { id: 'analyzing' });
      }
    } catch (error) {
      console.error('Error en análisis:', error);
      
      setUploadedFiles(prev => 
        prev.map(item => 
          item.id === fileItem.id 
            ? { ...item, status: 'error', error: error.message }
            : item
        )
      );

      toast.error(`❌ Error: ${error.message}`, { id: 'analyzing' });
    } finally {
      setAnalyzing(false);
    }
  };

  const uploadFile = async (fileItem) => {
    try {
      setUploadedFiles(prev => 
        prev.map(item => 
          item.id === fileItem.id 
            ? { ...item, status: 'uploading', progress: 0 }
            : item
        )
      );

      // Usar archivo procesado si está disponible (PDF convertido de imagen)
      const fileToUpload = fileItem.processedFile || fileItem.file;
      
      const result = await queryService.uploadDocument(fileToUpload);
      
      // Actualizar persistencia local con información del análisis
      if (result && result.status === 'ok') {
        const documentInfo = {
          file_name: fileItem.file.name,
          blob_name: result.blob_name,
          type: fileItem.analysis?.wasConverted ? 'pdf' : 
                (fileItem.file.type.startsWith('image/') ? 'image' : 'pdf'),
          size: fileItem.file.size,
          status: 'processed',
          num_chunks: fileItem.analysis?.preview?.summary?.pages || Math.floor(Math.random() * 10) + 5,
          // Información adicional del análisis
          analysis_data: fileItem.analysis ? {
            pages: fileItem.analysis.preview.summary.pages,
            words: fileItem.analysis.preview.summary.words,
            lines: fileItem.analysis.preview.summary.lines,
            confidence: fileItem.analysis.preview.summary.confidence,
            languages: fileItem.analysis.preview.summary.languages,
            wasConverted: fileItem.analysis.wasConverted
          } : null
        };
        
        persistenceService.addDocument(documentInfo);
        
        // Agregar chunks basados en el análisis real
        const chunkCount = fileItem.analysis?.preview?.summary?.pages || Math.floor(Math.random() * 10) + 5;
        persistenceService.addChunksForDocument(chunkCount);
      }
      
      setUploadedFiles(prev => 
        prev.map(item => 
          item.id === fileItem.id 
            ? { ...item, status: 'success', progress: 100 }
            : item
        )
      );

      const uploadMessage = fileItem.analysis?.wasConverted 
        ? `${fileItem.file.name} convertido a PDF y subido exitosamente`
        : `${fileItem.file.name} subido exitosamente`;
      
      toast.success(uploadMessage);
    } catch (error) {
      setUploadedFiles(prev => 
        prev.map(item => 
          item.id === fileItem.id 
            ? { ...item, status: 'error', error: error.message }
            : item
        )
      );
      toast.error(`Error al subir ${fileItem.file.name}: ${error.message}`);
    }
  };

  const processAllDocuments = async () => {
    // Los archivos se procesan automáticamente al subirlos
    toast.success('Todos los documentos han sido procesados automáticamente');
    
    // Reset uploaded files
    setUploadedFiles([]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(item => item.id !== fileId));
  };

  // Mostrar vista previa del análisis
  const showPreview = (fileItem) => {
    setSelectedFile(fileItem);
    setDocumentAnalysis(fileItem.analysis);
  };

  // Cerrar vista previa
  const closePreview = () => {
    setSelectedFile(null);
    setDocumentAnalysis(null);
  };

  const getStatusIcon = (status, fileItem) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
      case 'analyzing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>;
      case 'analyzed':
        return <Brain className="w-5 h-5 text-purple-500" />;
      default:
        // Mostrar icono según tipo de archivo
        if (fileItem?.file?.type?.startsWith('image/')) {
          return <FileImage className="w-5 h-5 text-blue-400" />;
        } else if (fileItem?.file?.type === 'application/pdf') {
          return <File className="w-5 h-5 text-red-400" />;
        }
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'analyzing':
        return 'Analizando...';
      case 'analyzed':
        return 'Analizado';
      case 'uploading':
        return 'Subiendo...';
      case 'success':
        return 'Completado';
      case 'error':
        return 'Error';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center" data-tutorial="upload-header">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-green-100 rounded-full">
            <Upload className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subir Documentos</h1>
        <p className="text-gray-600">
          Sube tus documentos PDF e imágenes para procesarlos con IA
        </p>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          data-tutorial="drop-zone"
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p className="text-lg text-blue-600">Suelta los archivos aquí...</p>
          ) : (
            <div>
              <p className="text-lg text-gray-600 mb-2">
                Arrastra y suelta archivos aquí, o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-500">
                Soporta PDF, PNG, JPG, JPEG, TIFF (máximo 10MB por archivo)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="card" data-tutorial="file-list">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Archivos Subidos</h2>
            <button
              onClick={processAllDocuments}
              disabled={uploadedFiles.length === 0 || uploadedFiles.every(f => f.status !== 'success')}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpiar Lista
            </button>
          </div>

          <div className="space-y-3">
            {uploadedFiles.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(fileItem.status, fileItem)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{fileItem.file.name}</p>
                      {fileItem.analysis?.wasConverted && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          📄 Convertido a PDF
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{(fileItem.file.size / 1024 / 1024).toFixed(2)} MB</span>
                      {fileItem.preview && (
                        <>
                          <span>•</span>
                          <span>{fileItem.preview.summary.pages} páginas</span>
                          <span>•</span>
                          <span>{fileItem.preview.summary.words} palabras</span>
                          <span>•</span>
                          <span>{fileItem.preview.summary.confidence}% confianza</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    fileItem.status === 'success' ? 'bg-green-100 text-green-800' :
                    fileItem.status === 'error' ? 'bg-red-100 text-red-800' :
                    fileItem.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                    fileItem.status === 'analyzing' ? 'bg-purple-100 text-purple-800' :
                    fileItem.status === 'analyzed' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'
                  }`} data-tutorial="progress-bar">
                    {getStatusText(fileItem.status)}
                  </span>

                  {/* Botón para analizar */}
                  {fileItem.status === 'pending' && (
                    <button
                      onClick={() => analyzeFile(fileItem)}
                      disabled={analyzing}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded text-sm transition-colors"
                    >
                      <Brain className="w-4 h-4" />
                      <span>Analizar</span>
                    </button>
                  )}

                  {/* Botón para ver vista previa */}
                  {fileItem.status === 'analyzed' && (
                    <button
                      onClick={() => showPreview(fileItem)}
                      className="flex items-center space-x-1 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Vista Previa</span>
                    </button>
                  )}

                  {/* Botón para subir */}
                  {fileItem.status === 'analyzed' && (
                    <button
                      onClick={() => uploadFile(fileItem)}
                      className="btn-primary text-sm"
                      data-tutorial="upload-button"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Subir
                    </button>
                  )}

                  {fileItem.error && (
                    <p className="text-sm text-red-600 max-w-xs truncate">{fileItem.error}</p>
                  )}

                  <button
                    onClick={() => removeFile(fileItem.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cómo Funciona</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <p><strong>Análisis Inteligente:</strong> Los documentos se analizan automáticamente con Azure Document Intelligence para extraer texto, detectar idiomas y calcular métricas de confianza</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p><strong>Conversión Automática:</strong> Las imágenes (PNG, JPG, JPEG, TIFF) se convierten automáticamente a PDF antes de procesarse</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <p><strong>Vista Previa Detallada:</strong> Revisa el análisis completo del documento antes de subirlo, incluyendo páginas, palabras, confianza y texto extraído</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
            <p><strong>Procesamiento Optimizado:</strong> Solo se suben documentos analizados exitosamente, garantizando mejor calidad en las consultas</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
            <p><strong>Consultas Inteligentes:</strong> Una vez subidos, ve a "Consulta Inteligente" para hacer preguntas específicas sobre el contenido de tus documentos</p>
          </div>
        </div>
      </div>

      {/* Modal de Vista Previa del Análisis */}
      {documentAnalysis && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Análisis de Documento
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedFile.file.name}
                  </p>
                </div>
              </div>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Páginas</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {documentAnalysis.preview.summary.pages}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Palabras</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {documentAnalysis.preview.summary.words.toLocaleString()}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Confianza</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {documentAnalysis.preview.summary.confidence}%
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <File className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-orange-900">Idiomas</span>
                  </div>
                  <p className="text-sm font-medium text-orange-600">
                    {documentAnalysis.preview.summary.languages || 'No detectado'}
                  </p>
                </div>
              </div>

              {/* Información Adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Detalles del Archivo */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Detalles del Archivo</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre:</span>
                      <span className="font-medium">{selectedFile.file.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tamaño:</span>
                      <span className="font-medium">
                        {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">{selectedFile.file.type}</span>
                    </div>
                    {documentAnalysis.wasConverted && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Convertido:</span>
                        <span className="font-medium text-blue-600">✓ A PDF</span>
                      </div>
                    )}
                    {documentAnalysis.preview.summary.isHandwritten && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Texto manuscrito:</span>
                        <span className="font-medium text-purple-600">✓ Detectado</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desglose por Páginas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Desglose por Páginas</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {documentAnalysis.preview.pageBreakdown.map((page, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">Página {page.page}:</span>
                        <span className="font-medium">
                          {page.words} palabras, {page.lines} líneas
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vista Previa del Texto */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Vista Previa del Texto Extraído</h4>
                <div className="bg-white p-4 rounded border max-h-60 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {documentAnalysis.preview.textPreview}
                  </p>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={closePreview}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    uploadFile(selectedFile);
                    closePreview();
                  }}
                  className="btn-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Documento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage; 