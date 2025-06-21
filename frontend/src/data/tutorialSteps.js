export const tutorialSteps = {
  dashboard: {
    es: [
      {
        target: '[data-tutorial="dashboard-header"]',
        title: '¡Bienvenido a DataCrafter! 🎉',
        content: 'Este es tu Dashboard principal donde puedes ver un resumen de toda tu actividad. Aquí encontrarás estadísticas importantes y acceso rápido a todas las funciones.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="stats-cards"]',
        title: 'Panel de Estadísticas 📊',
        content: 'Estas tarjetas muestran métricas clave en tiempo real: total de documentos, procesados, pendientes y chunks generados. Te dan una vista rápida del estado del sistema.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="total-documents-card"]',
        title: 'Contador de Documentos 📄',
        content: 'Esta tarjeta específica muestra el total de documentos en tu sistema. Es el indicador principal de tu biblioteca de documentos.',
        placement: 'right',
      },
      {
        target: '[data-tutorial="quick-actions"]',
        title: 'Acciones Rápidas ⚡',
        content: 'Desde aquí puedes acceder rápidamente a las tres funciones principales: Consultar documentos con IA, Subir nuevos documentos y Ver analytics detallados.',
        placement: 'top',
      },
      {
        target: '[data-tutorial="recent-documents"]',
        title: 'Documentos Recientes 📋',
        content: 'Aquí se muestran los últimos documentos que has procesado, con información sobre cuándo fueron procesados y cuántos chunks se generaron. Es tu historial de actividad reciente.',
        placement: 'top',
      }
    ],
    en: [
      {
        target: '[data-tutorial="dashboard-header"]',
        title: 'Welcome to DataCrafter! 🎉',
        content: 'This is your main Dashboard where you can see a summary of all your activity. Here you\'ll find important statistics and quick access to all functions.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="stats-cards"]',
        title: 'Statistics Panel 📊',
        content: 'These cards show key real-time metrics: total documents, processed, pending, and generated chunks. They give you a quick overview of system status.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="total-documents-card"]',
        title: 'Document Counter 📄',
        content: 'This specific card shows the total documents in your system. It\'s the main indicator of your document library.',
        placement: 'right',
      },
      {
        target: '[data-tutorial="quick-actions"]',
        title: 'Quick Actions ⚡',
        content: 'From here you can quickly access the three main functions: Query documents with AI, Upload new documents, and View detailed analytics.',
        placement: 'top',
      },
      {
        target: '[data-tutorial="recent-documents"]',
        title: 'Recent Documents 📋',
        content: 'Here you can see the latest documents you\'ve processed, with information about when they were processed and how many chunks were generated. This is your recent activity history.',
        placement: 'top',
      }
    ]
  },
  
  query: {
    es: [
      {
        target: '[data-tutorial="query-header"]',
        title: 'Consulta Inteligente 🤖',
        content: 'Esta es la página de consultas donde puedes hacer preguntas sobre tus documentos usando inteligencia artificial avanzada. El sistema buscará en todos tus documentos procesados.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="chat-interface"]',
        title: 'Área de Conversación 💬',
        content: 'Aquí se muestran todas tus conversaciones con el asistente de IA. Los mensajes aparecen en orden cronológico con scroll automático. Puedes ver tanto tus preguntas como las respuestas de la IA.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="input-area"]',
        title: 'Campo de Entrada 📝',
        content: 'Escribe tus preguntas aquí. El sistema detecta automáticamente textos largos y los procesa como documentos completos. Puedes usar Shift+Enter para nueva línea.',
        placement: 'top',
      },
      {
        target: '[data-tutorial="send-button"]',
        title: 'Botón Enviar 🚀',
        content: 'Haz clic aquí o presiona Enter para enviar tu pregunta. El sistema procesará tu consulta usando IA y buscará información relevante en tus documentos.',
        placement: 'left',
      },
      {
        target: '[data-tutorial="clear-button"]',
        title: 'Limpiar Historial 🧹',
        content: 'Este botón limpia todo el historial de chat, permitiéndote empezar una nueva conversación desde cero. Útil para comenzar un tema diferente.',
        placement: 'bottom',
      }
    ],
    en: [
      {
        target: '[data-tutorial="query-header"]',
        title: 'Intelligent Query 🤖',
        content: 'This is the query page where you can ask questions about your documents using advanced artificial intelligence. The system will search through all your processed documents.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="chat-interface"]',
        title: 'Conversation Area 💬',
        content: 'Here you can see all your conversations with the AI assistant. Messages appear in chronological order with automatic scrolling. You can view both your questions and AI responses.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="input-area"]',
        title: 'Input Field 📝',
        content: 'Write your questions here. The system automatically detects long texts and processes them as complete documents. You can use Shift+Enter for new lines.',
        placement: 'top',
      },
      {
        target: '[data-tutorial="send-button"]',
        title: 'Send Button 🚀',
        content: 'Click here or press Enter to send your question. The system will process your query using AI and search for relevant information in your documents.',
        placement: 'left',
      },
      {
        target: '[data-tutorial="clear-button"]',
        title: 'Clear History 🧹',
        content: 'This button clears all chat history, allowing you to start a new conversation from scratch. Useful for starting a different topic.',
        placement: 'bottom',
      }
    ]
  },

  upload: {
    es: [
      {
        target: '[data-tutorial="upload-header"]',
        title: 'Centro de Subida 📤',
        content: 'Esta página te permite subir documentos PDF e imágenes al sistema. Los documentos se procesan automáticamente con IA para extraer información y hacerlos consultables.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="drop-zone"]',
        title: 'Zona de Arrastre 🎯',
        content: 'Arrastra y suelta archivos aquí o haz clic para seleccionar desde tu computadora. Soporta PDF, PNG, JPG, JPEG y TIFF hasta 10MB por archivo.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="file-list"]',
        title: 'Gestor de Archivos 📋',
        content: 'Aquí aparecen todos los archivos que has seleccionado para subir, con su estado de procesamiento, tamaño y opciones de gestión individual.',
        placement: 'top',
      },
      {
        target: '[data-tutorial="upload-button"]',
        title: 'Subir Archivo ⬆️',
        content: 'Usa este botón para subir archivos individuales al servidor. Los archivos se procesan automáticamente con IA al subirlos.',
        placement: 'left',
      },
      {
        target: '[data-tutorial="progress-bar"]',
        title: 'Indicador de Estado 📊',
        content: 'Muestra el estado actual de cada archivo: Pendiente, Subiendo, Completado o Error. Te permite seguir el progreso de procesamiento de cada documento.',
        placement: 'left',
      }
    ],
    en: [
      {
        target: '[data-tutorial="upload-header"]',
        title: 'Upload Center 📤',
        content: 'This page allows you to upload PDF documents and images to the system. Documents are automatically processed with AI to extract information and make them queryable.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="drop-zone"]',
        title: 'Drop Zone 🎯',
        content: 'Drag and drop files here or click to select from your computer. Supports PDF, PNG, JPG, JPEG, and TIFF up to 10MB per file.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="file-list"]',
        title: 'File Manager 📋',
        content: 'Here you can see all files you\'ve selected for upload, with their processing status, size, and individual management options.',
        placement: 'top',
      },
      {
        target: '[data-tutorial="upload-button"]',
        title: 'Upload File ⬆️',
        content: 'Use this button to upload individual files to the server. Files are automatically processed with AI upon upload.',
        placement: 'left',
      },
      {
        target: '[data-tutorial="progress-bar"]',
        title: 'Status Indicator 📊',
        content: 'Shows the current status of each file: Pending, Uploading, Completed, or Error. Allows you to track the processing progress of each document.',
        placement: 'left',
      }
    ]
  },

  analytics: {
    es: [
      {
        target: '[data-tutorial="metrics-cards"]',
        title: 'Panel de Métricas 📈',
        content: 'Estas tarjetas muestran métricas clave en tiempo real: documentos procesados, pendientes, chunks totales y tasa de error del sistema.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="premium-chat"]',
        title: 'Chat Avanzado con IA 🤖',
        content: 'Un chat premium con Azure OpenAI que puede procesar consultas complejas y generar análisis detallados de tus documentos. Incluye procesamiento de texto largo.',
        placement: 'right',
      },
      {
        target: '[data-tutorial="sidebar-stats"]',
        title: 'Panel Lateral de Estadísticas 📊',
        content: 'El sidebar muestra distribución por tipos de documentos, documentos recientes y métricas de rendimiento del sistema en tiempo real.',
        placement: 'left',
      },
      {
        target: '[data-tutorial="export-buttons"]',
        title: 'Herramientas de Exportación 💾',
        content: 'Puedes exportar los análisis generados en múltiples formatos: Excel, PDF, JSON o como imagen. También puedes enviar PDFs directamente al backend.',
        placement: 'top',
      },
      {
        target: '[data-tutorial="visualization-modes"]',
        title: 'Modos de Visualización 👁️',
        content: 'Cambia entre diferentes formas de ver los datos: tabla estructurada, tarjetas visuales o JSON crudo. Cada modo ofrece una perspectiva única de la información.',
        placement: 'top',
      }
    ],
    en: [
      {
        target: '[data-tutorial="metrics-cards"]',
        title: 'Metrics Panel 📈',
        content: 'These cards show key real-time metrics: processed documents, pending ones, total chunks, and system error rate.',
        placement: 'bottom',
      },
      {
        target: '[data-tutorial="premium-chat"]',
        title: 'Advanced AI Chat 🤖',
        content: 'A premium chat with Azure OpenAI that can process complex queries and generate detailed analysis of your documents. Includes long text processing.',
        placement: 'right',
      },
      {
        target: '[data-tutorial="sidebar-stats"]',
        title: 'Sidebar Statistics Panel 📊',
        content: 'The sidebar shows real-time distribution by document types, recent documents, and system performance metrics.',
        placement: 'left',
      },
      {
        target: '[data-tutorial="export-buttons"]',
        title: 'Export Tools 💾',
        content: 'You can export generated analysis in multiple formats: Excel, PDF, JSON, or as an image. You can also send PDFs directly to the backend.',
        placement: 'top',
      },
      {
        target: '[data-tutorial="visualization-modes"]',
        title: 'Visualization Modes 👁️',
        content: 'Switch between different ways to view data: structured table, visual cards, or raw JSON. Each mode offers a unique perspective on the information.',
        placement: 'top',
      }
    ]
  }
}; 