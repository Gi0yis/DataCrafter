// Servicio de persistencia local para métricas y datos del dashboard
class PersistenceService {
  constructor() {
    this.METRICS_KEY = 'datacrafter_metrics';
    this.DASHBOARD_KEY = 'datacrafter_dashboard';
    this.listeners = new Set();
    this.initializeData();
  }

  // Sistema de eventos para actualización en tiempo real
  addEventListener(callback) {
    this.listeners.add(callback);
  }

  removeEventListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error en listener de persistencia:', error);
      }
    });
  }

  // Inicializar datos base si no existen
  initializeData() {
    if (!this.getMetrics()) {
      this.resetMetrics();
    }
    if (!this.getDashboardData()) {
      this.resetDashboard();
    }
  }

  // === MÉTODOS PARA MÉTRICAS ===
  
  getMetrics() {
    try {
      const data = localStorage.getItem(this.METRICS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      return null;
    }
  }

  saveMetrics(data) {
    try {
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.METRICS_KEY, JSON.stringify(data));
      this.notifyListeners(); // Notificar cambios
    } catch (error) {
      console.error('Error guardando métricas:', error);
    }
  }

  updateMetrics(updates) {
    const currentData = this.getMetrics();
    if (!currentData) return;

    // Actualizar métricas básicas
    if (updates.metrics) {
      Object.assign(currentData.metrics, updates.metrics);
    }

    // Actualizar analytics
    if (updates.analytics) {
      for (const [key, value] of Object.entries(updates.analytics)) {
        if (currentData.analytics[key]) {
          Object.assign(currentData.analytics[key], value);
        }
      }
    }

    this.saveMetrics(currentData);
  }

  incrementMetric(metricName, increment = 1) {
    const data = this.getMetrics();
    if (data && data.metrics[metricName] !== undefined) {
      data.metrics[metricName] += increment;
      this.saveMetrics(data);
    }
  }

  updateErrorRate(success = true) {
    const data = this.getMetrics();
    if (!data) return;

    data.metrics.operationsCount += 1;
    if (!success) {
      data.metrics.errorsCount += 1;
    }

    // Calcular tasa de error
    if (data.metrics.operationsCount > 0) {
      data.metrics.errorRate = (data.metrics.errorsCount / data.metrics.operationsCount) * 100;
    }

    this.saveMetrics(data);
  }

  addDocument(documentInfo) {
    const data = this.getMetrics();
    if (!data) return;

    // Agregar timestamp
    documentInfo.timestamp = new Date().toISOString();
    documentInfo.processing_date = new Date().toISOString();
    documentInfo.id = Date.now(); // ID único simple

    // Agregar a historial
    data.documentHistory.push(documentInfo);

    // Actualizar documentos recientes (mantener solo los últimos 10)
    data.recentDocuments.unshift(documentInfo);
    data.recentDocuments = data.recentDocuments.slice(0, 10);

    // Actualizar métricas
    data.metrics.totalDocuments += 1;
    data.metrics.processedDocuments += 1;

    // Actualizar tipo de documento
    const docType = documentInfo.type ? documentInfo.type.toLowerCase() : 'other';
    if (data.analytics.documentTypes[docType] !== undefined) {
      data.analytics.documentTypes[docType] += 1;
    } else {
      data.analytics.documentTypes.other += 1;
    }

    // Actualizar estadísticas de procesamiento
    data.analytics.processingStats.successfulOperations += 1;

    this.saveMetrics(data);
  }

  resetMetrics() {
    const defaultMetrics = {
      metrics: {
        processedDocuments: 0,
        pendingDocuments: 0,
        totalChunks: 0,
        errorRate: 0.0,
        totalDocuments: 0,
        lastUpdated: new Date().toISOString(),
        operationsCount: 0,
        errorsCount: 0
      },
      documentHistory: [],
      recentDocuments: [],
      analytics: {
        documentTypes: {
          pdf: 0,
          image: 0,
          text: 0,
          other: 0
        },
        processingStats: {
          averageProcessingTime: 0,
          totalProcessingTime: 0,
          successfulOperations: 0,
          failedOperations: 0
        },
        performance: {
          uploadsToday: 0,
          queriesProcessed: 0,
          systemUptime: 0
        }
      }
    };

    this.saveMetrics(defaultMetrics);
    return defaultMetrics;
  }

  // === MÉTODOS PARA DASHBOARD ===

  getDashboardData() {
    try {
      const data = localStorage.getItem(this.DASHBOARD_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
      return null;
    }
  }

  saveDashboardData(data) {
    try {
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.DASHBOARD_KEY, JSON.stringify(data));
      this.notifyListeners(); // Notificar cambios
    } catch (error) {
      console.error('Error guardando datos del dashboard:', error);
    }
  }

  updateDashboardHeaders(updates) {
    const data = this.getDashboardData();
    if (!data) return;

    if (updates.headers) {
      Object.assign(data.headers, updates.headers);
    }

    this.saveDashboardData(data);
  }

  addNotification(notification) {
    const data = this.getDashboardData();
    if (!data) return;

    notification.id = Date.now();
    notification.timestamp = new Date().toISOString();
    data.notifications.unshift(notification);

    // Mantener solo las últimas 20 notificaciones
    data.notifications = data.notifications.slice(0, 20);

    this.saveDashboardData(data);
  }

  updateSystemStatus(status, message) {
    const data = this.getDashboardData();
    if (!data) return;

    data.systemStatus = {
      status: status,
      message: message,
      lastCheck: new Date().toISOString()
    };

    this.saveDashboardData(data);
  }

  resetDashboard() {
    const defaultDashboard = {
      headers: {
        mainTitle: "Dashboard",
        subtitle: "Bienvenido a DataCrafter. Gestiona y consulta tus documentos de manera inteligente.",
        quickActionsTitle: "Acciones Rápidas",
        recentDocumentsTitle: "Documentos Recientes",
        lastUpdated: new Date().toISOString()
      },
      quickActions: [
        {
          title: "Consultar Documentos",
          description: "Haz preguntas sobre tus documentos",
          icon: "Brain",
          path: "/query",
          color: "bg-blue-500",
          enabled: true
        },
        {
          title: "Subir Documentos", 
          description: "Agrega nuevos documentos al sistema",
          icon: "Upload",
          path: "/upload",
          color: "bg-green-500",
          enabled: true
        },
        {
          title: "Ver Analytics",
          description: "Analiza el rendimiento del sistema",
          icon: "BarChart3", 
          path: "/analytics",
          color: "bg-purple-500",
          enabled: true
        }
      ],
      notifications: [],
      systemStatus: {
        status: "active",
        message: "Sistema operativo",
        lastCheck: new Date().toISOString()
      }
    };

    this.saveDashboardData(defaultDashboard);
    return defaultDashboard;
  }

  // === MÉTODOS DE UTILIDAD ===

  // Exportar todos los datos como JSON
  exportData() {
    return {
      metrics: this.getMetrics(),
      dashboard: this.getDashboardData(),
      exportDate: new Date().toISOString()
    };
  }

  // Importar datos desde JSON
  importData(data) {
    try {
      if (data.metrics) {
        this.saveMetrics(data.metrics);
      }
      if (data.dashboard) {
        this.saveDashboardData(data.dashboard);
      }
      return true;
    } catch (error) {
      console.error('Error importando datos:', error);
      return false;
    }
  }

  // Limpiar todos los datos
  clearAllData() {
    localStorage.removeItem(this.METRICS_KEY);
    localStorage.removeItem(this.DASHBOARD_KEY);
    this.initializeData();
  }

  // Obtener analytics formateados para las páginas
  getAnalyticsFormatted() {
    const metrics = this.getMetrics();
    if (!metrics) return null;

    return {
      processedDocuments: metrics.metrics.processedDocuments,
      pendingDocuments: metrics.metrics.pendingDocuments,
      totalChunks: metrics.metrics.totalChunks,
      errorRate: Math.round(metrics.metrics.errorRate * 100) / 100,
      totalDocuments: metrics.metrics.totalDocuments,
      documentTypes: metrics.analytics.documentTypes,
      performance: metrics.analytics.performance,
      processingStats: metrics.analytics.processingStats,
      recentDocuments: metrics.recentDocuments
    };
  }

  // Simular incremento de chunks cuando se procesa un documento
  addChunksForDocument(chunkCount = 5) {
    this.incrementMetric('totalChunks', chunkCount);
  }

  // Simular procesamiento de consulta
  processQuery() {
    const data = this.getMetrics();
    if (data) {
      data.analytics.performance.queriesProcessed += 1;
      this.saveMetrics(data);
    }
  }

  // Procesar análisis de contenido y actualizar métricas en tiempo real
  processAnalysisContent(content, fileName = 'Análisis') {
    try {
      let parsedData = [];
      
      // Intentar parsear el contenido JSON
      if (typeof content === 'string') {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      } else if (Array.isArray(content)) {
        parsedData = content;
      }

      if (parsedData.length > 0) {
        const data = this.getMetrics();
        if (!data) return;

        // Calcular métricas del análisis
        const totalChunks = parsedData.reduce((sum, item) => sum + (item.chunks_generados || 0), 0);
        const categories = [...new Set(parsedData.map(item => item.categoria).filter(Boolean))];
        const fileTypes = [...new Set(parsedData.map(item => item.tipo_archivo).filter(Boolean))];

        // Actualizar métricas inmediatamente
        data.metrics.totalChunks += totalChunks;
        data.metrics.processedDocuments += 1;
        data.metrics.totalDocuments += 1;

        // Actualizar tipos de archivo
        fileTypes.forEach(type => {
          const normalizedType = type.toLowerCase();
          if (data.analytics.documentTypes[normalizedType] !== undefined) {
            data.analytics.documentTypes[normalizedType] += 1;
          } else {
            data.analytics.documentTypes.other += 1;
          }
        });

        // Agregar documento al historial
        const documentInfo = {
          file_name: fileName,
          blob_name: `analysis_${Date.now()}`,
          type: fileTypes[0] || 'text',
          size: JSON.stringify(parsedData).length,
          status: 'processed',
          num_chunks: totalChunks,
          timestamp: new Date().toISOString(),
          processing_date: new Date().toISOString(),
          id: Date.now(),
          categories: categories,
          elements_count: parsedData.length
        };

        // Actualizar documentos recientes
        data.recentDocuments.unshift(documentInfo);
        data.recentDocuments = data.recentDocuments.slice(0, 10);

        // Agregar al historial
        data.documentHistory.push(documentInfo);

        // Actualizar estadísticas de procesamiento
        data.analytics.processingStats.successfulOperations += 1;

        // Guardar cambios
        this.saveMetrics(data);

        return {
          elementsCount: parsedData.length,
          totalChunks: totalChunks,
          categories: categories,
          fileTypes: fileTypes,
          documentInfo: documentInfo
        };
      }
    } catch (error) {
      console.error('Error procesando análisis:', error);
      this.updateErrorRate(false);
    }
    return null;
  }
}

// Instancia singleton
export const persistenceService = new PersistenceService(); 