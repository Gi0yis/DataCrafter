import axios from 'axios';
import { persistenceService } from './persistence';

const API_BASE_URL = 'https://2eb9-172-173-216-155.ngrok-free.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const queryService = {
  // Consultar documentos
  async query(question, k = 50) {
    try {
      const requestBody = {
        question: question,
        k: k
      };
      
      console.log('Sending request:', requestBody);
      const response = await api.post('/query', requestBody);
      console.log('Query response:', response.data); // Debug log
      
      // Actualizar persistencia local cuando se consulta exitosamente
      if (response.data && response.data.answer) {
        persistenceService.processQuery();
        persistenceService.updateErrorRate(true);
      }
      
      return response.data;
    } catch (error) {
      // Actualizar tasa de error como fallo
      persistenceService.updateErrorRate(false);
      
      console.error('Query API Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error al procesar la consulta';
      throw new Error(errorMessage);
    }
  },

  // Subir documentos
  async uploadDocument(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      // Actualizar persistencia local cuando se sube exitosamente
      if (response.data && response.data.status === 'ok') {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const documentType = fileExtension === 'pdf' ? 'pdf' : 'image';
        
        persistenceService.addDocument({
          file_name: file.name,
          blob_name: response.data.blob_name,
          type: documentType,
          size: file.size,
          status: 'processed',
          num_chunks: Math.floor(Math.random() * 10) + 5 // Simular chunks
        });
        
        // Agregar chunks simulados
        persistenceService.addChunksForDocument(Math.floor(Math.random() * 10) + 5);
        
        // Actualizar tasa de error como éxito
        persistenceService.updateErrorRate(true);
      }
      
      return response.data;
    } catch (error) {
      // Actualizar tasa de error como fallo
      persistenceService.updateErrorRate(false);
      throw new Error(error.response?.data?.error || 'Error al subir documento');
    }
  },

  // Obtener estadísticas desde persistencia local
  async getAnalytics() {
    try {
      // Usar persistencia local en lugar del backend
      const analytics = persistenceService.getAnalyticsFormatted();
      if (analytics) {
        return analytics;
      }
      
      // Fallback a datos base si no hay persistencia local
      return {
        processedDocuments: 0,
        pendingDocuments: 0,
        totalChunks: 0,
        errorRate: 0.0,
        totalDocuments: 0,
        documentTypes: { pdf: 0, image: 0, text: 0, other: 0 },
        performance: { uploadsToday: 0, queriesProcessed: 0, systemUptime: 0 },
        processingStats: { averageProcessingTime: 0, successfulOperations: 0, failedOperations: 0 },
        recentDocuments: []
      };
    } catch (error) {
      console.error('Error obteniendo analytics:', error);
      return {
        processedDocuments: 0,
        pendingDocuments: 0,
        totalChunks: 0,
        errorRate: 0.0,
        totalDocuments: 0,
        documentTypes: { pdf: 0, image: 0, text: 0, other: 0 },
        performance: { uploadsToday: 0, queriesProcessed: 0, systemUptime: 0 },
        processingStats: { averageProcessingTime: 0, successfulOperations: 0, failedOperations: 0 },
        recentDocuments: []
      };
    }
  },

  // Obtener documentos procesados desde persistencia local
  async getProcessedDocuments() {
    try {
      const metrics = persistenceService.getMetrics();
      return metrics ? metrics.recentDocuments : [];
    } catch (error) {
      console.error('Error obteniendo documentos:', error);
      return [];
    }
  },

  // Obtener métricas completas desde persistencia local
  async getMetrics() {
    try {
      const metrics = persistenceService.getMetrics();
      return metrics || persistenceService.resetMetrics();
    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      return persistenceService.resetMetrics();
    }
  },

  // Obtener datos del dashboard desde persistencia local
  async getDashboard() {
    try {
      const dashboard = persistenceService.getDashboardData();
      return dashboard || persistenceService.resetDashboard();
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
      return persistenceService.resetDashboard();
    }
  },

  // Resetear métricas locales
  async resetMetrics() {
    try {
      persistenceService.resetMetrics();
      return { status: 'Métricas restablecidas exitosamente' };
    } catch {
      throw new Error('Error al resetear métricas locales');
    }
  },

  // Actualizar estado del sistema localmente
  async updateSystemStatus(status, message) {
    try {
      persistenceService.updateSystemStatus(status, message);
      return { status: 'Estado actualizado exitosamente' };
    } catch {
      throw new Error('Error al actualizar estado local');
    }
  },

  // Exportar datos de persistencia local
  async exportPersistenceData() {
    try {
      return persistenceService.exportData();
    } catch {
      throw new Error('Error al exportar datos de persistencia');
    }
  },

  // Importar datos a persistencia local
  async importPersistenceData(data) {
    try {
      const success = persistenceService.importData(data);
      if (success) {
        return { status: 'Datos importados exitosamente' };
      } else {
        throw new Error('Error en el formato de datos');
      }
    } catch {
      throw new Error('Error al importar datos de persistencia');
    }
  },

  // Limpiar todos los datos locales
  async clearAllData() {
    try {
      persistenceService.clearAllData();
      return { status: 'Todos los datos han sido eliminados' };
    } catch {
      throw new Error('Error al limpiar datos locales');
    }
  },

  // Procesar documentos
  async processDocuments() {
    try {
      const response = await api.post('/process');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error al procesar documentos');
    }
  }
};

// Azure Assistant services
export const azureAssistantService = {
  // Chat con el asistente
  chat: async (message) => {
    try {
      const response = await fetch(`${API_BASE_URL}/azure-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Azure Assistant Chat Error:', error);
      throw error;
    }
  },

  // Upload y procesamiento de archivos
  uploadAndProcess: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/azure-assistant/upload`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Azure Assistant Upload Error:', error);
      throw error;
    }
  }
};

// Función para enviar análisis como PDF al backend
export const sendAnalysisAsPDF = async (analysisData, fileName = 'analysis') => {
  try {
    // Crear el contenido del PDF como texto plano que el backend puede procesar
    const pdfContent = formatAnalysisForPDF(analysisData);
    
    // Crear un Blob como si fuera un archivo PDF (el backend lo procesará)
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    
    // Crear FormData para enviar como archivo
    const formData = new FormData();
    formData.append('file', blob, `${fileName}_analysis.pdf`);
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true'
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al enviar PDF: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error enviando análisis como PDF:', error);
    throw error;
  }
};

// Función para formatear el análisis para PDF
const formatAnalysisForPDF = (analysisData) => {
  try {
    let content = '';
    
    // Si es un string, intentar parsearlo como JSON
    if (typeof analysisData === 'string') {
      // Buscar JSON en el contenido
      const jsonMatch = analysisData.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          content = formatJSONDataToPDF(parsedData);
        } catch {
          // Si no se puede parsear como JSON, usar el texto completo
          content = analysisData;
        }
      } else {
        content = analysisData;
      }
    } else if (Array.isArray(analysisData)) {
      content = formatJSONDataToPDF(analysisData);
    } else {
      content = JSON.stringify(analysisData, null, 2);
    }
    
    // Agregar header del documento
    const header = `ANÁLISIS DATACRAFTER - ${new Date().toLocaleString()}
${'='.repeat(60)}

RESUMEN EJECUTIVO:
Este documento contiene el análisis completo generado por DataCrafter AI.
Incluye la estructuración de datos no estructurados y métricas de procesamiento.

${'='.repeat(60)}

CONTENIDO DEL ANÁLISIS:

`;
    
    const footer = `

${'='.repeat(60)}
DOCUMENTO GENERADO POR DATACRAFTER AI
Fecha: ${new Date().toLocaleString()}
${'='.repeat(60)}`;
    
    return header + content + footer;
  } catch (error) {
    console.error('Error formateando análisis:', error);
    return analysisData.toString();
  }
};

// Función para formatear datos JSON a texto para PDF
const formatJSONDataToPDF = (data) => {
  if (!Array.isArray(data)) return JSON.stringify(data, null, 2);
  
  let content = '';
  let totalElementos = data.length;
  let categorias = [...new Set(data.map(item => item.categoria).filter(Boolean))];
  
  // Resumen inicial
  content += `RESUMEN DEL ANÁLISIS:
- Total de elementos procesados: ${totalElementos}
- Categorías identificadas: ${categorias.length}
- Categorías: ${categorias.join(', ')}

${'='.repeat(60)}

ELEMENTOS DETALLADOS:

`;
  
  data.forEach((item, index) => {
    content += `${'-'.repeat(50)}
ELEMENTO ${index + 1} de ${totalElementos}
${'-'.repeat(50)}

`;
    
    if (item.titulo) content += `📋 TÍTULO: ${item.titulo}\n\n`;
    if (item.categoria) content += `🏷️ CATEGORÍA: ${item.categoria}\n\n`;
    if (item.contenido) content += `📝 CONTENIDO:\n${item.contenido}\n\n`;
    if (item.palabras_clave && Array.isArray(item.palabras_clave)) {
      content += `🔑 PALABRAS CLAVE: ${item.palabras_clave.join(', ')}\n\n`;
    }
    if (item.tipo_archivo) content += `📄 TIPO DE ARCHIVO: ${item.tipo_archivo}\n\n`;
    if (item.chunks_generados) content += `⚡ CHUNKS GENERADOS: ${item.chunks_generados}\n\n`;
    if (item.posicion_documento) content += `📍 POSICIÓN EN DOCUMENTO: ${item.posicion_documento}\n\n`;
    if (item.nivel_detalle) content += `📊 NIVEL DE DETALLE: ${item.nivel_detalle}\n\n`;
    
    content += '\n';
  });
  
  return content;
};

export default api; 