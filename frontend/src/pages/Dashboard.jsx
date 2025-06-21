import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Upload, BarChart3, FileText, Clock, CheckCircle } from 'lucide-react';
import { queryService } from '../services/api';
import { useMetrics } from '../hooks/usePersistence';
import toast from 'react-hot-toast';

const Dashboard = () => {
  // Usar el hook personalizado para métricas con actualizaciones en tiempo real
  const { metrics } = useMetrics();
  
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentDocuments();
  }, []);

  const loadRecentDocuments = async () => {
    try {
      setLoading(true);
      const documents = await queryService.getProcessedDocuments();
      setRecentDocuments(documents.slice(0, 5));
    } catch (error) {
      toast.error('Error al cargar documentos recientes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Mapear las métricas del hook al formato esperado por el Dashboard
  const stats = {
    totalDocuments: metrics.documentosProcessed + metrics.documentosPendientes,
    processedDocuments: metrics.documentosProcessed,
    pendingDocuments: metrics.documentosPendientes,
    totalChunks: metrics.totalChunks,
  };

  const quickActions = [
    {
      title: 'Consultar Documentos',
      description: 'Haz preguntas sobre tus documentos',
      icon: Brain,
      path: '/query',
      color: 'bg-blue-500',
    },
    {
      title: 'Subir Documentos',
      description: 'Agrega nuevos documentos al sistema',
      icon: Upload,
      path: '/upload',
      color: 'bg-green-500',
    },
    {
      title: 'Ver Analytics',
      description: 'Analiza el rendimiento del sistema',
      icon: BarChart3,
      path: '/analytics',
      color: 'bg-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div data-tutorial="dashboard-header">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Bienvenido a DataCrafter. Gestiona y consulta tus documentos de manera inteligente.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tutorial="stats-cards">
        <div className="card" data-tutorial="total-documents-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documentos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Procesados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processedDocuments}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingDocuments}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chunks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChunks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div data-tutorial="quick-actions">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.path}
                className="card hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Documents */}
      <div data-tutorial="recent-documents">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Documentos Recientes</h2>
        <div className="card">
          {recentDocuments.length > 0 ? (
            <div className="space-y-4">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.file_name}</p>
                      <p className="text-sm text-gray-500">
                        Procesado el {new Date(doc.processing_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {doc.num_chunks} chunks
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay documentos procesados aún</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 