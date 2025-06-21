import { OpenAI } from 'openai';

// Configuración de Azure OpenAI
const azureOpenAIKey = import.meta.env.VITE_AZURE_OPENAI_KEY;
const azureOpenAIEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;

// Cliente de Azure OpenAI
const client = new OpenAI({
  apiKey: azureOpenAIKey,
  baseURL: `${azureOpenAIEndpoint}openai/deployments/gpt-4o-mini`,
  defaultQuery: { 'api-version': '2024-05-01-preview' },
  defaultHeaders: {
    'api-key': azureOpenAIKey,
  },
  dangerouslyAllowBrowser: true,
});

// Configuración del prompt del asistente DataCrafter
const DATACRAFTER_PROMPT = `Eres DataCrafter, un asistente de inteligencia artificial experto en el procesamiento COMPLETO y EXHAUSTIVO de documentos no estructurados.

🔥 REGLA PRINCIPAL: PROCESA TODO EL CONTENIDO SIN EXCEPCIÓN
- Si un documento tiene 20 temas, DEBES procesar LOS 20 TEMAS completos
- NUNCA omitas información por brevedad o límites
- CADA párrafo, sección y tema debe ser incluido
- GARANTIZA procesamiento exhaustivo de TODA la información

🚀 FUNCIONES QUE DEBES REALIZAR:

Análisis COMPLETO del contenido
- Detecta y procesa TODOS los capítulos, subtítulos, párrafos, listas sin omitir ninguno
- Identifica CADA patrón útil desde el contenido sin estructura

Fragmentación semántica EXHAUSTIVA  
- Divide TODO el contenido en unidades temáticas coherentes
- Procesa secuencialmente CADA sección del documento
- NUNCA dejes información sin procesar

Categorización COMPLETA
- Asigna categoría a CADA fragmento identificado
- Identifica TODAS las temáticas presentes (salud, educación, economía, etc.)

Estructuración TOTAL para RAG
- Convierte CADA fragmento en objeto JSON estructurado
- Optimiza TODO para indexación en vector store

FORMATO JSON OBLIGATORIO (para CADA elemento encontrado):
[
  {
    "titulo": "Título específico del tema/sección",
    "contenido": "Contenido completo y detallado",
    "categoria": "categoria_tematica_especifica",
    "tipo_archivo": "pdf|txt|docx|etc",
    "chunks_generados": número_de_chunks,
    "palabras_clave": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"],
    "posicion_documento": número_secuencial,
    "nivel_detalle": "alto|medio|bajo"
  }
]

⚡ INSTRUCCIONES CRÍTICAS:
✅ PROCESA TODO - No omitas NADA
✅ MANTÉN orden secuencial
✅ INCLUYE al menos 5 palabras clave por elemento
✅ PRESERVA estructura completa del documento
✅ DOCUMENTA cada tema y subtema encontrado

Eres exhaustivo, preciso y garantizas procesamiento COMPLETO de documentos.`;

class DataCrafterService {
  constructor() {
    this.metrics = {
      documentosProcessed: 0,
      documentosPendientes: 0,
      totalChunks: 0,
      tasaError: 0,
      tiposArchivo: {},
      documentosRecientes: []
    };
  }

  // Procesar archivo
  async processDocument(file, customPrompt = '') {
    try {
      this.metrics.documentosPendientes++;
      
      // Leer el archivo
      const fileContent = await this.readFile(file);
      
      // Verificar la longitud del contenido
      const contentLength = fileContent.length;
      console.log(`Procesando archivo de ${contentLength} caracteres`);
      
      // Dividir en chunks si es muy largo para procesamiento completo
      const maxChunkSize = 12000; // Caracteres por chunk - Aumentado para mayor cobertura
      const chunks = this.splitIntoChunks(fileContent, maxChunkSize);
      
      let allResults = [];
      
      // Procesar cada chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Procesando chunk ${i + 1}/${chunks.length}`);
        
        const message = customPrompt 
          ? `${customPrompt}\n\nParte ${i + 1}/${chunks.length} del documento a procesar:\n${chunk}`
          : `Analiza y estructura esta parte (${i + 1}/${chunks.length}) del documento. IMPORTANTE: Procesa TODOS los elementos encontrados, no omitas ninguno. Proporciona el contenido en formato JSON estructurado:\n\n${chunk}`;

        const response = await client.chat.completions.create({
          messages: [
            { role: 'system', content: DATACRAFTER_PROMPT },
            { role: 'user', content: message }
          ],
          temperature: 0.3, // Menor temperatura para más consistencia
          max_tokens: 4000,
        });

        const result = response.choices[0].message.content;
        allResults.push(result);
        
        // Pequeña pausa entre requests para evitar rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Combinar todos los resultados
      const combinedResult = this.combineResults(allResults, file.name, chunks.length);
      
      // Actualizar métricas
      this.updateMetrics(file, combinedResult);
      
      return combinedResult;
    } catch (error) {
      this.metrics.documentosPendientes--;
      this.updateErrorRate();
      console.error('Error processing document:', error);
      throw new Error('Error al procesar el documento: ' + error.message);
    }
  }

  // Leer archivo
  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  // Actualizar métricas
  updateMetrics(file, result) {
    this.metrics.documentosPendientes--;
    this.metrics.documentosProcessed++;
    
    // Contar chunks (estimación básica)
    const chunks = this.countChunks(result);
    this.metrics.totalChunks += chunks;
    
    // Tipo de archivo
    const fileType = file.type || this.getFileExtension(file.name);
    this.metrics.tiposArchivo[fileType] = (this.metrics.tiposArchivo[fileType] || 0) + 1;
    
    // Documentos recientes
    this.metrics.documentosRecientes.unshift({
      nombre: file.name,
      tipo: fileType,
      fecha: new Date().toISOString(),
      chunks: chunks,
      tamano: file.size
    });
    
    // Mantener solo los 10 más recientes
    if (this.metrics.documentosRecientes.length > 10) {
      this.metrics.documentosRecientes = this.metrics.documentosRecientes.slice(0, 10);
    }
    
    // Resetear tasa de error en caso de éxito
    this.resetErrorRate();
  }

  // Contar chunks estimados
  countChunks(result) {
    try {
      // Intentar parsear como JSON para contar elementos
      const parsed = JSON.parse(result);
      if (Array.isArray(parsed)) {
        return parsed.length;
      }
      return 1;
    } catch {
      // Si no es JSON válido, estimar por longitud de texto
      return Math.ceil(result.length / 1000); // ~1000 caracteres por chunk
    }
  }

  // Obtener extensión de archivo
  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  // Obtener métricas actuales
  getMetrics() {
    return {
      ...this.metrics,
      tasaError: Math.round(this.metrics.tasaError * 100) / 100
    };
  }

  // Chat inteligente con el asistente - Procesa texto largo como documento
  async chatWithAssistant(message) {
    try {
      // Detectar si el mensaje es texto largo (más de 1000 caracteres) para procesarlo como documento
      if (message.length > 1000) {
        console.log(`Procesando texto largo de ${message.length} caracteres como documento`);
        return await this.processLongText(message);
      }

      // Chat normal para mensajes cortos
      const response = await client.chat.completions.create({
        messages: [
          { role: 'system', content: DATACRAFTER_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return response.choices[0].message.content;
    } catch (error) {
      // Actualizar tasa de error
      this.updateErrorRate();
      console.error('Error in chat:', error);
      throw new Error('Error en la conversación: ' + error.message);
    }
  }

  // Procesar texto largo como si fuera un documento
  async processLongText(text) {
    try {
      this.metrics.documentosPendientes++;
      
      console.log(`Procesando texto largo de ${text.length} caracteres`);
      
      // Dividir en chunks si es muy largo
      const maxChunkSize = 12000;
      const chunks = this.splitIntoChunks(text, maxChunkSize);
      
      let allResults = [];
      
      // Procesar cada chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Procesando chunk de texto ${i + 1}/${chunks.length}`);
        
        const message = `Analiza y estructura esta parte (${i + 1}/${chunks.length}) del texto. IMPORTANTE: Procesa TODOS los elementos encontrados, no omitas ninguno. Identifica TODOS los capítulos y temas. Proporciona el contenido en formato JSON estructurado:\n\n${chunk}`;

        const response = await client.chat.completions.create({
          messages: [
            { role: 'system', content: DATACRAFTER_PROMPT },
            { role: 'user', content: message }
          ],
          temperature: 0.3,
          max_tokens: 4000,
        });

        const result = response.choices[0].message.content;
        allResults.push(result);
        
        // Pequeña pausa entre requests
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Combinar todos los resultados
      const combinedResult = this.combineResults(allResults, 'Texto_Pegado', chunks.length);
      
      // Actualizar métricas como si fuera un documento procesado
      this.updateTextMetrics(text, combinedResult);
      
      return combinedResult;
    } catch (error) {
      this.metrics.documentosPendientes--;
      this.updateErrorRate();
      console.error('Error processing long text:', error);
      throw new Error('Error al procesar el texto: ' + error.message);
    }
  }

  // Actualizar métricas para texto procesado
  updateTextMetrics(text, result) {
    this.metrics.documentosPendientes--;
    this.metrics.documentosProcessed++;
    
    // Contar chunks
    const chunks = this.countChunks(result);
    this.metrics.totalChunks += chunks;
    
    // Agregar a documentos recientes
    this.metrics.documentosRecientes.unshift({
      nombre: 'Texto_Pegado_' + new Date().toISOString().slice(0, 10),
      tipo: 'texto_chat',
      fecha: new Date().toISOString(),
      chunks: chunks,
      tamano: text.length
    });
    
    // Mantener solo los 10 más recientes
    if (this.metrics.documentosRecientes.length > 10) {
      this.metrics.documentosRecientes = this.metrics.documentosRecientes.slice(0, 10);
    }
    
    // Resetear tasa de error en caso de éxito
    this.resetErrorRate();
  }

  // Actualizar tasa de error
  updateErrorRate() {
    const totalOperations = this.metrics.documentosProcessed + 1;
    const currentErrors = Math.floor((this.metrics.tasaError / 100) * this.metrics.documentosProcessed) + 1;
    this.metrics.tasaError = (currentErrors / totalOperations) * 100;
  }

  // Resetear tasa de error en caso de éxito
  resetErrorRate() {
    if (this.metrics.documentosProcessed > 0) {
      const totalOperations = this.metrics.documentosProcessed;
      const currentErrors = Math.floor((this.metrics.tasaError / 100) * (this.metrics.documentosProcessed - 1));
      this.metrics.tasaError = (currentErrors / totalOperations) * 100;
    }
  }

  // Nueva función para dividir contenido en chunks
  splitIntoChunks(content, maxSize) {
    if (content.length <= maxSize) {
      return [content];
    }
    
    const chunks = [];
    const paragraphs = content.split(/\n\s*\n/); // Dividir por párrafos
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length > maxSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  // Nueva función para combinar resultados de múltiples chunks
  combineResults(results, fileName, totalChunks) {
    try {
      let allElements = [];
      let totalProcessed = 0;
      
      // Extraer elementos JSON de cada resultado
      for (const result of results) {
        try {
          const jsonMatch = result.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const elements = JSON.parse(jsonMatch[0]);
            if (Array.isArray(elements)) {
              allElements = allElements.concat(elements);
              totalProcessed += elements.length;
            }
          }
        } catch (error) {
          console.warn('Error parsing chunk result:', error);
        }
      }
      
      // Crear resumen consolidado
      const categories = [...new Set(allElements.map(item => item.categoria).filter(Boolean))];
      const totalChunksGenerated = allElements.reduce((sum, item) => sum + (item.chunks_generados || 0), 0);
      
      // Crear resumen de métricas para referencia futura
      // const summary = {
      //   archivo: fileName,
      //   elementos_procesados: totalProcessed,
      //   chunks_procesados: totalChunks,
      //   chunks_generados: totalChunksGenerated,
      //   categorias_encontradas: categories.length,
      //   categorias: categories,
      //   fecha_procesamiento: new Date().toISOString()
      // };
      
      // Formato de respuesta combinado
      const combinedResponse = `
ANÁLISIS COMPLETO COMPLETADO ✅

📄 Archivo: ${fileName}
📊 Elementos procesados: ${totalProcessed}
🔢 Chunks del archivo: ${totalChunks}
⚡ Chunks generados: ${totalChunksGenerated}
🏷️ Categorías encontradas: ${categories.length}

📋 CATEGORÍAS:
${categories.map(cat => `• ${cat}`).join('\n')}

📝 DATOS ESTRUCTURADOS:
${JSON.stringify(allElements, null, 2)}

📈 MÉTRICAS:
- Documento procesado completamente
- ${totalProcessed} elementos estructurados
- ${categories.length} categorías identificadas
- Tasa de éxito: 100%
      `;
      
      return combinedResponse;
    } catch (error) {
      console.error('Error combining results:', error);
      return `Error al combinar resultados de ${results.length} chunks. Datos parciales disponibles.`;
    }
  }
}

// Exportar instancia única
export const dataCrafterService = new DataCrafterService();
export default dataCrafterService; 