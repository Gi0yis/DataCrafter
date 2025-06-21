import { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Upload, 
  Send, 
  Brain, 
  MessageCircle,
  RefreshCw,
  FileCheck,
  Zap,
  Eye,
  Download,
  Trash2,
  Upload as UploadIcon,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import dataCrafterService from '../services/azureOpenAI';
import DataVisualization from '../components/DataVisualization';
import { sendAnalysisAsPDF, queryService } from '../services/api';
import { persistenceService } from '../services/persistence';
import { useMetrics } from '../hooks/usePersistence';

const AnalyticsPage = () => {
  // Usar el hook personalizado para métricas con actualizaciones en tiempo real
  const { metrics, loadMetrics } = useMetrics();
  
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const [sendingPDF, setSendingPDF] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Scroll automático al final cuando se agreguen mensajes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, loading]);



  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setProcessingFile(true);
      
      const newMessage = {
        id: Date.now(),
        type: 'file_upload',
        content: `Procesando archivo: ${file.name}`,
        timestamp: new Date().toISOString(),
        sender: 'user',
        fileName: file.name
      };
      
      setChatHistory(prev => [...prev, newMessage]);
      
      // Procesar el archivo con DataCrafter
      const result = await dataCrafterService.processDocument(file);
      
      // Procesar análisis en tiempo real y actualizar métricas
      const analysisInfo = persistenceService.processAnalysisContent(result, file.name);
      
      const responseMessage = {
        id: Date.now() + 1,
        type: 'analysis_result',
        content: result,
        timestamp: new Date().toISOString(),
        sender: 'datacrafter',
        fileName: file.name,
        originalFileName: file.name,
        analysisInfo: analysisInfo // Agregar información del análisis
      };
      
      setChatHistory(prev => [...prev, responseMessage]);
      
      // Las métricas se actualizan automáticamente a través del hook
      
      if (analysisInfo) {
        toast.success(`✅ ${file.name} procesado: ${analysisInfo.elementsCount} elementos, ${analysisInfo.totalChunks} chunks`);
      } else {
        toast.success(`Archivo ${file.name} procesado exitosamente`);
      }
    } catch (error) {
      toast.error('Error al procesar el archivo: ' + error.message);
      console.error('File processing error:', error);
    } finally {
      setProcessingFile(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setLoading(true);
      
      // Detectar si es texto largo para mostrar mensaje apropiado
      const isLongText = message.length > 1000;
      
      const userMessage = {
        id: Date.now(),
        type: isLongText ? 'long_text' : 'chat',
        content: message,
        timestamp: new Date().toISOString(),
        sender: 'user',
        isLongText: isLongText
      };
      
      setChatHistory(prev => [...prev, userMessage]);
      setMessage('');
      
      // Enviar mensaje a DataCrafter
      const response = await dataCrafterService.chatWithAssistant(message);
      
      // Procesar análisis en tiempo real y actualizar métricas
      let analysisInfo = null;
      if (response) {
        const fileName = isLongText ? 'Texto_Pegado' : 'Consulta_Chat';
        analysisInfo = persistenceService.processAnalysisContent(response, fileName);
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        type: isLongText ? 'analysis_result' : 'chat',
        content: response,
        timestamp: new Date().toISOString(),
        sender: 'datacrafter',
        fileName: isLongText ? 'Texto_Pegado' : undefined,
        originalFileName: isLongText ? 'Texto_Pegado' : undefined,
        analysisInfo: analysisInfo // Agregar información del análisis
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
      
      // Las métricas se actualizan automáticamente si fue texto largo
      if (isLongText) {
        if (analysisInfo) {
          toast.success(`✅ Texto procesado: ${analysisInfo.elementsCount} elementos, ${analysisInfo.totalChunks} chunks`);
        } else {
          toast.success('Texto largo procesado como documento completo');
        }
      }
      
    } catch (error) {
      toast.error('Error en la conversación: ' + error.message);
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = (msg) => {
    console.log('Viewing analysis for message:', msg);
    console.log('Message content:', msg.content);
    setSelectedAnalysis(msg);
    setShowVisualization(true);
    toast.success('Abriendo vista detallada del análisis');
  };

  const handleSendAnalysisAsPDF = async (msg) => {
    try {
      setSendingPDF(true);
      
      // Crear nombre de archivo basado en el fileName del mensaje
      const fileName = msg.fileName || 'analysis';
      const cleanFileName = fileName.replace(/\.[^/.]+$/, ""); // Remover extensión si existe
      
      // Enviar análisis como PDF al backend
      const result = await sendAnalysisAsPDF(msg.content, cleanFileName);
      
      toast.success(`✅ Análisis enviado como PDF al backend: ${cleanFileName}_analysis.pdf`);
      console.log('PDF enviado exitosamente:', result);
      
      // Las métricas se actualizan automáticamente
      
    } catch (error) {
      console.error('Error enviando PDF:', error);
      toast.error(`❌ Error al enviar PDF: ${error.message}`);
    } finally {
      setSendingPDF(false);
    }
  };

  // Funciones para manejar persistencia local
  const handleResetMetrics = async () => {
    try {
      await queryService.resetMetrics();
      // Las métricas se actualizan automáticamente a través del hook
      toast.success('🔄 Métricas restablecidas a valores base');
    } catch (error) {
      toast.error('Error al resetear métricas');
      console.error(error);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await queryService.exportPersistenceData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datacrafter_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('📁 Datos exportados exitosamente');
    } catch (error) {
      toast.error('Error al exportar datos');
      console.error(error);
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await queryService.importPersistenceData(data);
      // Las métricas se actualizan automáticamente a través del hook
      toast.success('📥 Datos importados exitosamente');
    } catch (error) {
      toast.error('Error al importar datos: ' + error.message);
      console.error(error);
    } finally {
      event.target.value = '';
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('⚠️ ¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
      try {
        await queryService.clearAllData();
        // Las métricas se actualizan automáticamente a través del hook
        setChatHistory([]);
        toast.success('🗑️ Todos los datos han sido eliminados');
      } catch (error) {
        toast.error('Error al eliminar datos');
        console.error(error);
      }
    }
  };

  const renderMessage = (msg) => {
    if (msg.sender === 'user') {
      return (
        <div className="flex justify-end mb-4">
          <div className="max-w-xs sm:max-w-sm lg:max-w-md relative">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl sm:rounded-2xl rounded-br-md px-3 sm:px-4 lg:px-6 py-3 sm:py-4 shadow-lg">
              {msg.type === 'file_upload' ? (
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">{msg.content}</span>
                </div>
              ) : msg.type === 'long_text' ? (
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm font-medium">Texto largo para procesar</span>
                  </div>
                  <div className="bg-white/20 rounded p-1.5 sm:p-2 max-h-24 sm:max-h-32 overflow-y-auto">
                    <p className="text-xs leading-relaxed">{msg.content.substring(0, 150)}...</p>
                  </div>
                  <div className="text-xs text-blue-100 opacity-75">
                    {msg.content.length} chars • Como documento
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm leading-relaxed">{msg.content}</p>
              )}
              <div className="text-xs text-blue-100 mt-1.5 sm:mt-2 opacity-75">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex justify-start mb-3 sm:mb-4">
          <div className="flex items-start space-x-2 sm:space-x-3 max-w-full sm:max-w-3xl lg:max-w-4xl">
            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="relative group flex-1 min-w-0">
              <div className="bg-white border border-gray-200 text-gray-800 rounded-xl sm:rounded-2xl rounded-bl-md px-3 sm:px-4 lg:px-6 py-3 sm:py-4 shadow-lg">
                                  {msg.type === 'analysis_result' ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-1 min-w-0">
                          <FileCheck className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium text-green-700 truncate">
                            Análisis: {msg.fileName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                          <button
                            onClick={() => handleViewAnalysis(msg)}
                            className="flex items-center space-x-1 px-2 sm:px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span className="hidden sm:inline">Ver Detalle</span>
                            <span className="sm:hidden">Ver</span>
                          </button>
                          <button
                            onClick={() => handleSendAnalysisAsPDF(msg)}
                            disabled={sendingPDF}
                            className="flex items-center space-x-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                            title="Enviar análisis como PDF al backend"
                          >
                            {sendingPDF ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            <span className="hidden sm:inline">Enviar PDF</span>
                            <span className="sm:hidden">PDF</span>
                          </button>
                        </div>
                      </div>
                    
                    {/* Tarjeta de análisis dinámico en tiempo real */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {(() => {
                          // Usar analysisInfo si está disponible, sino parsear el contenido
                          let elementsCount = 0;
                          let totalChunks = 0;
                          let categories = [];
                          let fileTypes = [];

                          if (msg.analysisInfo) {
                            // Usar datos procesados en tiempo real
                            elementsCount = msg.analysisInfo.elementsCount;
                            totalChunks = msg.analysisInfo.totalChunks;
                            categories = msg.analysisInfo.categories;
                            fileTypes = msg.analysisInfo.fileTypes;
                          } else {
                            // Fallback al parsing manual
                            try {
                              const data = typeof msg.content === 'string' 
                                ? JSON.parse(msg.content.match(/\[[\s\S]*\]/)?.[0] || '[]')
                                : msg.content;
                              
                              if (Array.isArray(data)) {
                                elementsCount = data.length;
                                totalChunks = data.reduce((sum, item) => sum + (item.chunks_generados || 0), 0);
                                categories = [...new Set(data.map(item => item.categoria).filter(Boolean))];
                                fileTypes = [...new Set(data.map(item => item.tipo_archivo).filter(Boolean))];
                              }
                            } catch (error) {
                              console.error('Error parsing content:', error);
                            }
                          }

                          return (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 flex items-center">
                                  <FileText className="w-4 h-4 mr-1" />
                                  Elementos:
                                </span>
                                <span className="font-bold text-blue-600 text-lg">{elementsCount}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 flex items-center">
                                  <Zap className="w-4 h-4 mr-1" />
                                  Chunks:
                                </span>
                                <span className="font-bold text-purple-600 text-lg">{totalChunks}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 flex items-center">
                                  <BarChart3 className="w-4 h-4 mr-1" />
                                  Categorías:
                                </span>
                                <span className="font-bold text-green-600 text-lg">{categories.length}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Estado:
                                </span>
                                <span className="font-medium text-green-600 px-2 py-1 bg-green-100 rounded-full text-xs">
                                  ✅ Completado
                                </span>
                              </div>
                              {fileTypes.length > 0 && (
                                <div className="col-span-2 flex justify-between items-center pt-2 border-t border-blue-200">
                                  <span className="text-gray-600 text-xs">Tipos de archivo:</span>
                                  <div className="flex space-x-1">
                                    {fileTypes.map((type, i) => (
                                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                        {type.toUpperCase()}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {msg.analysisInfo && (
                                <div className="col-span-2 pt-2 border-t border-blue-200">
                                  <div className="flex items-center justify-center space-x-2 text-xs text-green-600">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span>Actualizado en tiempo real</span>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Categorías encontradas - Datos en tiempo real */}
                    {(() => {
                      let categories = [];
                      
                      if (msg.analysisInfo) {
                        // Usar datos procesados en tiempo real
                        categories = msg.analysisInfo.categories;
                      } else {
                        // Fallback al parsing manual
                        try {
                          const data = typeof msg.content === 'string' 
                            ? JSON.parse(msg.content.match(/\[[\s\S]*\]/)?.[0] || '[]')
                            : msg.content;
                          
                          categories = Array.isArray(data)
                            ? [...new Set(data.map(item => item.categoria).filter(Boolean))]
                            : [];
                        } catch (error) {
                          console.error('Error parsing categories:', error);
                        }
                      }

                      if (categories.length > 0) {
                        return (
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm text-gray-700 font-medium mr-2 flex items-center">
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Categorías detectadas:
                              </span>
                              {categories.slice(0, 6).map((cat, i) => (
                                <span key={i} className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-medium shadow-sm">
                                  {cat}
                                </span>
                              ))}
                              {categories.length > 6 && (
                                <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                  +{categories.length - 6} más
                                </span>
                              )}
                            </div>
                            {msg.analysisInfo && (
                              <div className="mt-2 text-xs text-purple-600 flex items-center">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse mr-1"></div>
                                Actualizado automáticamente
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  DataCrafter · {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="text-center relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full opacity-20 blur-xl"></div>
          </div>
          <div className="relative">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-md opacity-30"></div>
                <div className="relative p-2 sm:p-3 lg:p-4 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full shadow-xl">
                  <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 sm:mb-3">
                DataCrafter Analytics
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                Asistente de IA especializado en procesamiento de documentos no estructurados y análisis semántico
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Sistema DataCrafter activo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6" data-tutorial="metrics-cards">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg lg:rounded-xl">
                <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Documentos Procesados</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{metrics.documentosProcessed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg lg:rounded-xl">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Documentos Pendientes</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{metrics.documentosPendientes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg lg:rounded-xl">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Chunks</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{metrics.totalChunks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-red-100 to-pink-100 rounded-lg lg:rounded-xl">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Tasa de Error</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{metrics.tasaError.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Gestión de Persistencia */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-5 lg:p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg lg:rounded-xl">
              <Database className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Gestión de Persistencia Local</h3>
              <p className="text-xs sm:text-sm text-gray-600">Administra los datos guardados en el navegador</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Resetear Métricas */}
            <button
              onClick={handleResetMetrics}
              className="flex items-center justify-center space-x-2 p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg lg:rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Resetear Métricas</span>
            </button>

            {/* Exportar Datos */}
            <button
              onClick={handleExportData}
              className="flex items-center justify-center space-x-2 p-3 sm:p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg lg:rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Exportar JSON</span>
            </button>

            {/* Importar Datos */}
            <label className="flex items-center justify-center space-x-2 p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg lg:rounded-xl transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer">
              <UploadIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Importar JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>

            {/* Limpiar Todo */}
            <button
              onClick={handleClearAllData}
              className="flex items-center justify-center space-x-2 p-3 sm:p-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg lg:rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Limpiar Todo</span>
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>💡 Persistencia Local:</strong> Los datos se guardan en tu navegador y persisten entre sesiones. 
              Usa "Exportar JSON" para hacer respaldo y "Importar JSON" para restaurar datos guardados.
            </p>
          </div>
        </div>

        {/* Visualización de datos cuando está seleccionada */}
        {showVisualization && selectedAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-blue-600 text-white">
                <h2 className="text-sm sm:text-lg lg:text-xl font-bold truncate mr-2">
                  Análisis: {selectedAnalysis.fileName}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSendAnalysisAsPDF(selectedAnalysis)}
                    disabled={sendingPDF}
                    className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-xs sm:text-sm"
                    title="Enviar análisis como PDF al backend"
                    data-tutorial="export-buttons"
                  >
                    {sendingPDF ? (
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    ) : (
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                    <span className="hidden sm:inline">Enviar PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </button>
                  <button
                    onClick={() => setShowVisualization(false)}
                    className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors flex-shrink-0"
                  >
                    <span className="text-white text-lg sm:text-xl">✕</span>
                  </button>
                </div>
              </div>
              <div className="p-3 sm:p-4 lg:p-6 overflow-y-auto max-h-[calc(95vh-60px)] sm:max-h-[calc(90vh-80px)] lg:max-h-[calc(90vh-100px)]">
                <DataVisualization 
                  data={selectedAnalysis.content}
                  fileName={selectedAnalysis.originalFileName?.replace(/\.[^/.]+$/, "") || 'analysis'}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Chat Interface Principal */}
          <div className="lg:col-span-2 order-2 lg:order-1" data-tutorial="premium-chat">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-4 sm:p-5 lg:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                      <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold">DataCrafter Assistant</h2>
                      <p className="text-purple-100 text-xs sm:text-sm">Procesamiento Inteligente de Documentos</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm text-purple-100">IA Activa</span>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">Subir Documento</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={loadMetrics}
                      className="p-1.5 sm:p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        // Datos de prueba para verificar la funcionalidad
                        const testData = `[
                          {
                            "titulo": "Turismo",
                            "contenido": "En este apartado se exponen diversas situaciones relacionadas con turismo.",
                            "categoria": "turismo",
                            "tipo_archivo": "txt",
                            "chunks_generados": 1,
                            "palabras_clave": ["turismo", "iniciativas", "impactos"]
                          },
                          {
                            "titulo": "Tecnología",
                            "contenido": "En este apartado se exponen diversas situaciones relacionadas con tecnología.",
                            "categoria": "tecnología",
                            "tipo_archivo": "txt",
                            "chunks_generados": 1,
                            "palabras_clave": ["tecnología", "iniciativas", "impactos"]
                          }
                        ]`;
                        
                        const testMessage = {
                          id: Date.now(),
                          type: 'analysis_result',
                          content: testData,
                          timestamp: new Date().toISOString(),
                          sender: 'datacrafter',
                          fileName: 'test_file.txt',
                          originalFileName: 'test_file.txt'
                        };
                        
                        handleViewAnalysis(testMessage);
                      }}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                    >
                      🧪 Prueba
                    </button>
                  </div>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-purple-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept=".txt,.pdf,.docx,.doc,.json"
                    className="hidden"
                    disabled={processingFile}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processingFile}
                    className="w-full flex flex-col items-center space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {processingFile ? (
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600"></div>
                    ) : (
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    )}
                    <div className="text-center">
                      <p className="text-xs sm:text-sm font-medium text-gray-700">
                        {processingFile ? 'Procesando archivo...' : 'Haz clic para subir un archivo'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Soporta: TXT, PDF, DOCX, JSON
                      </p>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Chat Area */}
              <div className="p-4 sm:p-5 lg:p-6 h-64 sm:h-80 lg:h-96 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 mb-4 sm:mb-6 px-1 sm:px-2 custom-scrollbar">
                  {chatHistory.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 py-6 sm:py-8 lg:py-12">
                      <div className="relative mb-4 sm:mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full opacity-20 blur-xl"></div>
                        <div className="relative p-3 sm:p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl sm:rounded-2xl">
                          <Brain className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-400" />
                        </div>
                      </div>
                      <div className="text-center space-y-1 sm:space-y-2 px-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-700">¡DataCrafter listo para trabajar!</h3>
                        <p className="text-sm sm:text-base text-gray-500">Sube un archivo o haz una pregunta para comenzar</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatHistory.map((msg) => (
                        <div key={msg.id}>
                          {renderMessage(msg)}
                        </div>
                      ))}
                      
                      {loading && (
                        <div className="flex justify-start mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                              <Brain className="w-4 h-4 text-white" />
                            </div>
                            <div className="relative group">
                              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-800 rounded-2xl rounded-bl-md px-6 py-4 shadow-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                  </div>
                                  <span className="text-sm text-gray-600">DataCrafter está pensando...</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Ref para scroll automático */}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSendMessage} className="relative">
                  {message.length > 1000 && (
                    <div className="mb-2 px-2 sm:px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg text-xs text-purple-700 flex items-center space-x-1 sm:space-x-2">
                      <FileText className="w-3 h-3 flex-shrink-0" />
                      <span className="text-xs">Texto largo ({message.length} chars) - Se procesará como documento</span>
                    </div>
                  )}
                  <div className="flex items-end bg-gray-50 rounded-xl sm:rounded-2xl border-2 border-gray-200 focus-within:border-purple-500 focus-within:bg-white transition-all duration-300 shadow-sm">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Pregunta algo a DataCrafter o pega texto largo para procesar..."
                      className="flex-1 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-500 resize-none min-h-[48px] sm:min-h-[60px] max-h-24 sm:max-h-32 text-sm sm:text-base"
                      disabled={loading}
                      rows={1}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, window.innerWidth < 640 ? 96 : 128) + 'px';
                      }}
                    />
                    <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 pb-3 sm:pb-4">
                      <div className="text-xs text-gray-400 hidden sm:block">
                        {message.length > 0 && `${message.length}`}
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        ) : (
                          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar con métricas detalladas */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2" data-tutorial="sidebar-stats">
            {/* Distribución por Tipo de Archivo */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg sm:rounded-xl">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800">Distribución por Tipo</h3>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {Object.entries(metrics.tiposArchivo).length === 0 ? (
                  <p className="text-xs sm:text-sm text-gray-500 text-center py-3 sm:py-4">No hay archivos procesados aún</p>
                ) : (
                  Object.entries(metrics.tiposArchivo).map(([tipo, count]) => (
                    <div key={tipo} className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">{tipo}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-900">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Documentos Recientes */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg sm:rounded-xl">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-800">Documentos Recientes</h3>
                </div>
                {chatHistory.filter(msg => msg.type === 'analysis_result').length > 0 && (
                  <button
                    onClick={() => {
                      const analysisMessages = chatHistory.filter(msg => msg.type === 'analysis_result');
                      if (analysisMessages.length > 0) {
                        handleSendAnalysisAsPDF(analysisMessages[0]); // Enviar el más reciente
                      }
                    }}
                    disabled={sendingPDF}
                    className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                    title="Enviar último análisis como PDF"
                  >
                    {sendingPDF ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    <span className="hidden lg:inline">PDF</span>
                  </button>
                )}
              </div>
              <div className="space-y-2 sm:space-y-3">
                {metrics.documentosRecientes.length === 0 ? (
                  <p className="text-xs sm:text-sm text-gray-500 text-center py-3 sm:py-4">No hay documentos recientes</p>
                ) : (
                  metrics.documentosRecientes.slice(0, 5).map((doc, index) => (
                    <div key={index} className="p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">{doc.nombre}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{doc.chunks} chunks</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{doc.tipo}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.fecha).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Rendimiento */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg sm:rounded-xl">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800">Rendimiento</h3>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Procesados</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{metrics.documentosProcessed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Pendientes</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{metrics.documentosPendientes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Total Chunks</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{metrics.totalChunks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Tasa Error</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{metrics.tasaError.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 