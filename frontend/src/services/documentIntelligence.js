import DocumentIntelligence, { getLongRunningPoller, isUnexpected } from "@azure-rest/ai-document-intelligence";
import jsPDF from 'jspdf';

class DocumentIntelligenceService {
  constructor() {
    // Configuración de Azure Document Intelligence - directamente en el código
    this.endpoint = "https://agent-document.cognitiveservices.azure.com/";
    this.key = "8M83GBtaBRuCidExZqtlBZBG5x9pk8bgam9cOWHnB8HKP9IoBsJwJQQJ99BFACYeBjFXJ3w3AAALACOGYQNe";
    this.client = DocumentIntelligence(this.endpoint, { key: this.key });
  }

  // Función para extraer texto de spans
  *getTextOfSpans(content, spans) {
    for (const span of spans) {
      yield content.slice(span.offset, span.offset + span.length);
    }
  }

  // Analizar documento o imagen usando Azure Document Intelligence
  async analyzeDocument(file) {
    try {
      console.log('Analizando documento con Azure Document Intelligence:', file.name);

      // Convertir archivo a base64 para enviar a Azure
      const base64Data = await this.fileToBase64(file);
      
      const initialResponse = await this.client
        .path("/documentModels/{modelId}:analyze", "prebuilt-read")
        .post({
          contentType: "application/octet-stream",
          body: base64Data,
        });

      if (isUnexpected(initialResponse)) {
        throw new Error(initialResponse.body.error?.message || 'Error en Azure Document Intelligence');
      }

      const poller = getLongRunningPoller(this.client, initialResponse);
      const result = await poller.pollUntilDone();
      const analyzeResult = result.body.analyzeResult;

      return this.processAnalysisResult(analyzeResult, file);
    } catch (error) {
      console.error('Error analizando documento:', error);
      throw new Error(`Error al analizar documento: ${error.message}`);
    }
  }

  // Procesar resultado del análisis
  processAnalysisResult(analyzeResult, file) {
    const content = analyzeResult?.content || '';
    const pages = analyzeResult?.pages || [];
    const languages = analyzeResult?.languages || [];
    const styles = analyzeResult?.styles || [];

    // Información general del documento
    const documentInfo = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      totalPages: pages.length,
      totalWords: pages.reduce((sum, page) => sum + (page.words?.length || 0), 0),
      totalLines: pages.reduce((sum, page) => sum + (page.lines?.length || 0), 0),
      extractedText: content,
      confidence: this.calculateAverageConfidence(pages),
      languages: languages.map(lang => ({
        locale: lang.locale,
        confidence: lang.confidence
      })),
      isHandwritten: styles.some(style => style.isHandwritten),
      processingTime: new Date().toISOString()
    };

    // Información detallada por página
    const pageDetails = pages.map(page => ({
      pageNumber: page.pageNumber,
      width: page.width,
      height: page.height,
      angle: page.angle,
      unit: page.unit,
      linesCount: page.lines?.length || 0,
      wordsCount: page.words?.length || 0,
      lines: page.lines?.map(line => line.content) || [],
      words: page.words?.map(word => ({
        content: word.content,
        confidence: word.confidence
      })) || []
    }));

    return {
      documentInfo,
      pageDetails,
      rawResult: analyzeResult
    };
  }

  // Calcular confianza promedio
  calculateAverageConfidence(pages) {
    if (!pages || pages.length === 0) return 0;
    
    let totalConfidence = 0;
    let totalWords = 0;
    
    pages.forEach(page => {
      if (page.words) {
        page.words.forEach(word => {
          if (word.confidence !== undefined) {
            totalConfidence += word.confidence;
            totalWords++;
          }
        });
      }
    });
    
    return totalWords > 0 ? (totalConfidence / totalWords) : 0;
  }

  // Convertir archivo a base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remover el prefijo data:type;base64,
        const base64 = reader.result.split(',')[1];
        // Convertir a Uint8Array que es lo que espera la API
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        resolve(bytes);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Convertir imagen a PDF
  async convertImageToPDF(imageFile) {
    try {
      console.log('Convirtiendo imagen a PDF:', imageFile.name);
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const img = new Image();
            img.onload = () => {
              // Crear nuevo PDF
              const pdf = new jsPDF();
              
              // Calcular dimensiones para ajustar la imagen al PDF
              const pageWidth = pdf.internal.pageSize.getWidth();
              const pageHeight = pdf.internal.pageSize.getHeight();
              
              let imgWidth = img.width;
              let imgHeight = img.height;
              
              // Escalar imagen si es muy grande
              const maxWidth = pageWidth - 20; // margen de 10 a cada lado
              const maxHeight = pageHeight - 20; // margen de 10 arriba y abajo
              
              if (imgWidth > maxWidth) {
                const ratio = maxWidth / imgWidth;
                imgWidth = maxWidth;
                imgHeight = imgHeight * ratio;
              }
              
              if (imgHeight > maxHeight) {
                const ratio = maxHeight / imgHeight;
                imgHeight = maxHeight;
                imgWidth = imgWidth * ratio;
              }
              
              // Centrar imagen en la página
              const x = (pageWidth - imgWidth) / 2;
              const y = (pageHeight - imgHeight) / 2;
              
              // Agregar imagen al PDF
              pdf.addImage(event.target.result, 'JPEG', x, y, imgWidth, imgHeight);
              
              // Convertir PDF a blob
              const pdfBlob = pdf.output('blob');
              
              // Crear nuevo archivo PDF
              const pdfFile = new File([pdfBlob], 
                imageFile.name.replace(/\.[^/.]+$/, ".pdf"), 
                { type: 'application/pdf' }
              );
              
              resolve(pdfFile);
            };
            
            img.onerror = () => reject(new Error('Error cargando imagen'));
            img.src = event.target.result;
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('Error leyendo archivo'));
        reader.readAsDataURL(imageFile);
      });
    } catch (error) {
      console.error('Error convirtiendo imagen a PDF:', error);
      throw new Error(`Error convirtiendo imagen: ${error.message}`);
    }
  }

  // Determinar si el archivo es una imagen
  isImageFile(file) {
    return file.type.startsWith('image/');
  }

  // Determinar si el archivo es un PDF
  isPDFFile(file) {
    return file.type === 'application/pdf';
  }

  // Generar vista previa del documento
  generatePreview(analysisResult) {
    const { documentInfo, pageDetails } = analysisResult;
    
    return {
      title: `Análisis de ${documentInfo.fileName}`,
      summary: {
        pages: documentInfo.totalPages,
        words: documentInfo.totalWords,
        lines: documentInfo.totalLines,
        confidence: Math.round(documentInfo.confidence * 100),
        languages: documentInfo.languages.map(lang => lang.locale).join(', '),
        isHandwritten: documentInfo.isHandwritten
      },
      textPreview: documentInfo.extractedText.substring(0, 500) + 
                   (documentInfo.extractedText.length > 500 ? '...' : ''),
      pageBreakdown: pageDetails.map(page => ({
        page: page.pageNumber,
        lines: page.linesCount,
        words: page.wordsCount,
        dimensions: `${page.width}x${page.height}${page.unit}`
      }))
    };
  }

  // Procesar archivo completo (analizar + convertir si es imagen)
  async processFile(file) {
    try {
      let fileToProcess = file;
      let wasConverted = false;
      
      // Si es imagen, convertir a PDF primero
      if (this.isImageFile(file)) {
        console.log('Detectada imagen, convirtiendo a PDF...');
        fileToProcess = await this.convertImageToPDF(file);
        wasConverted = true;
      }
      
      // Analizar el documento
      const analysisResult = await this.analyzeDocument(fileToProcess);
      
      // Generar vista previa
      const preview = this.generatePreview(analysisResult);
      
      return {
        originalFile: file,
        processedFile: fileToProcess,
        wasConverted,
        analysisResult,
        preview,
        success: true
      };
    } catch (error) {
      console.error('Error procesando archivo:', error);
      return {
        originalFile: file,
        processedFile: null,
        wasConverted: false,
        analysisResult: null,
        preview: null,
        error: error.message,
        success: false
      };
    }
  }
}

// Instancia singleton
export const documentIntelligenceService = new DocumentIntelligenceService(); 