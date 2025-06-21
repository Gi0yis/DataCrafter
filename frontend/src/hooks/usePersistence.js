import { useState, useEffect, useCallback } from 'react';
import { persistenceService } from '../services/persistence';
import { queryService } from '../services/api';

// Hook personalizado para manejar persistencia con actualizaciones en tiempo real
export const usePersistence = () => {
  const [metrics, setMetrics] = useState({
    processedDocuments: 0,
    pendingDocuments: 0,
    totalChunks: 0,
    errorRate: 0.0,
    totalDocuments: 0,
    documentTypes: { pdf: 0, image: 0, text: 0, other: 0 },
    performance: { uploadsToday: 0, queriesProcessed: 0, systemUptime: 0 },
    processingStats: { averageProcessingTime: 0, successfulOperations: 0, failedOperations: 0 },
    recentDocuments: []
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para cargar métricas
  const loadMetrics = useCallback(async () => {
    try {
      const analytics = await queryService.getAnalytics();
      setMetrics({
        processedDocuments: analytics.processedDocuments,
        pendingDocuments: analytics.pendingDocuments,
        totalChunks: analytics.totalChunks,
        errorRate: analytics.errorRate,
        totalDocuments: analytics.totalDocuments,
        documentTypes: analytics.documentTypes,
        performance: analytics.performance,
        processingStats: analytics.processingStats,
        recentDocuments: analytics.recentDocuments
      });
    } catch (error) {
      console.error('Error cargando métricas:', error);
    }
  }, []);

  // Función para cargar datos del dashboard
  const loadDashboard = useCallback(async () => {
    try {
      const dashboard = await queryService.getDashboard();
      setDashboardData(dashboard);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    }
  }, []);

  // Función para recargar todos los datos
  const reloadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadMetrics(), loadDashboard()]);
    setLoading(false);
  }, [loadMetrics, loadDashboard]);

  // Configurar listener para actualizaciones automáticas
  useEffect(() => {
    const handleUpdate = () => {
      loadMetrics();
      loadDashboard();
    };

    // Agregar listener
    persistenceService.addEventListener(handleUpdate);

    // Cargar datos iniciales
    reloadData();

    // Cleanup: remover listener
    return () => {
      persistenceService.removeEventListener(handleUpdate);
    };
  }, [loadMetrics, loadDashboard, reloadData]);

  // Funciones de utilidad
  const incrementProcessedDocuments = useCallback(() => {
    persistenceService.incrementMetric('processedDocuments');
  }, []);

  const incrementTotalChunks = useCallback((count = 1) => {
    persistenceService.incrementMetric('totalChunks', count);
  }, []);

  const updateErrorRate = useCallback((success = true) => {
    persistenceService.updateErrorRate(success);
  }, []);

  const addDocument = useCallback((documentInfo) => {
    persistenceService.addDocument(documentInfo);
  }, []);

  const processQuery = useCallback(() => {
    persistenceService.processQuery();
  }, []);

  const resetMetrics = useCallback(async () => {
    try {
      await queryService.resetMetrics();
      await reloadData();
      return { success: true, message: 'Métricas restablecidas exitosamente' };
    } catch (error) {
      return { success: false, message: 'Error al resetear métricas' };
    }
  }, [reloadData]);

  const exportData = useCallback(async () => {
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
      return { success: true, message: 'Datos exportados exitosamente' };
    } catch (error) {
      return { success: false, message: 'Error al exportar datos' };
    }
  }, []);

  const importData = useCallback(async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await queryService.importPersistenceData(data);
      await reloadData();
      return { success: true, message: 'Datos importados exitosamente' };
    } catch (error) {
      return { success: false, message: 'Error al importar datos: ' + error.message };
    }
  }, [reloadData]);

  const clearAllData = useCallback(async () => {
    try {
      await queryService.clearAllData();
      await reloadData();
      return { success: true, message: 'Todos los datos han sido eliminados' };
    } catch (error) {
      return { success: false, message: 'Error al eliminar datos' };
    }
  }, [reloadData]);

  return {
    // Estado
    metrics,
    dashboardData,
    loading,
    
    // Funciones de carga
    loadMetrics,
    loadDashboard,
    reloadData,
    
    // Funciones de actualización
    incrementProcessedDocuments,
    incrementTotalChunks,
    updateErrorRate,
    addDocument,
    processQuery,
    
    // Funciones de gestión
    resetMetrics,
    exportData,
    importData,
    clearAllData
  };
};

// Hook más simple solo para métricas
export const useMetrics = () => {
  const [metrics, setMetrics] = useState({
    documentosProcessed: 0,
    documentosPendientes: 0,
    totalChunks: 0,
    tasaError: 0,
    tiposArchivo: {},
    documentosRecientes: []
  });

  const loadMetrics = useCallback(async () => {
    try {
      const analytics = await queryService.getAnalytics();
      setMetrics({
        documentosProcessed: analytics.processedDocuments,
        documentosPendientes: analytics.pendingDocuments,
        totalChunks: analytics.totalChunks,
        tasaError: analytics.errorRate,
        tiposArchivo: analytics.documentTypes,
        documentosRecientes: analytics.recentDocuments
      });
    } catch (error) {
      console.error('Error cargando métricas:', error);
    }
  }, []);

  useEffect(() => {
    // Configurar listener para actualizaciones automáticas
    const handleUpdate = () => {
      loadMetrics();
    };

    persistenceService.addEventListener(handleUpdate);
    loadMetrics(); // Cargar datos iniciales

    return () => {
      persistenceService.removeEventListener(handleUpdate);
    };
  }, [loadMetrics]);

  return { metrics, loadMetrics };
}; 