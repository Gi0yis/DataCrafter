import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Table, 
  Image, 
  FileSpreadsheet,
  Filter,
  Search,
  Eye,
  EyeOff,
  Grid,
  List
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const DataVisualization = ({ data, fileName = 'datacrafter_analysis' }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table', 'cards', 'json'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({
    titulo: true,
    categoria: true,
    contenido: true,
    chunks_generados: true,
    palabras_clave: true,
    tipo_archivo: true
  });

  // Parsear datos si vienen como string
  const parsedData = React.useMemo(() => {
    try {
      if (typeof data === 'string') {
        // Buscar array JSON en el string
        const jsonMatch = data.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return [];
      }
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error parsing data:', error);
      return [];
    }
  }, [data]);

  // Filtrar datos
  const filteredData = React.useMemo(() => {
    return parsedData.filter(item => {
      const matchesSearch = !searchTerm || 
        item.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contenido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.palabras_clave?.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !filterCategory || item.categoria === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [parsedData, searchTerm, filterCategory]);

  // Obtener categorías únicas
  const categories = React.useMemo(() => {
    const cats = [...new Set(parsedData.map(item => item.categoria).filter(Boolean))];
    return cats.sort();
  }, [parsedData]);

  // Funciones de exportación
  const exportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'DataCrafter Analysis');
      
      // Estilo para las columnas
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "4F46E5" } },
          color: { rgb: "FFFFFF" }
        };
      }
      
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      toast.success('Excel exportado exitosamente');
    } catch (error) {
      toast.error('Error al exportar Excel: ' + error.message);
    }
  };

  const exportToPDF = () => {
    try {
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape
      const pageHeight = pdf.internal.pageSize.height;
      const pageWidth = pdf.internal.pageSize.width;
      
      // Título
      pdf.setFontSize(20);
      pdf.setTextColor(79, 70, 229);
      pdf.text('DataCrafter Analysis Report', 20, 20);
      
      // Fecha
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Resumen
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total de elementos: ${filteredData.length}`, 20, 40);
      pdf.text(`Categorías: ${categories.length}`, 20, 50);
      
      let yPos = 70;
      
      filteredData.forEach((item, index) => {
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = 20;
        }
        
        // Título del elemento
        pdf.setFontSize(14);
        pdf.setTextColor(79, 70, 229);
        pdf.text(`${index + 1}. ${item.titulo || 'Sin título'}`, 20, yPos);
        yPos += 10;
        
        // Categoría
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Categoría: ${item.categoria || 'N/A'}`, 25, yPos);
        yPos += 8;
        
        // Contenido (limitado)
        pdf.setTextColor(0, 0, 0);
        const content = item.contenido || '';
        const lines = pdf.splitTextToSize(content.substring(0, 200) + '...', pageWidth - 50);
        pdf.text(lines.slice(0, 3), 25, yPos);
        yPos += lines.slice(0, 3).length * 5 + 10;
        
        // Palabras clave
        if (item.palabras_clave && item.palabras_clave.length > 0) {
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Palabras clave: ${item.palabras_clave.join(', ')}`, 25, yPos);
          yPos += 10;
        }
        
        yPos += 5;
      });
      
      pdf.save(`${fileName}.pdf`);
      toast.success('PDF exportado exitosamente');
    } catch (error) {
      toast.error('Error al exportar PDF: ' + error.message);
    }
  };

  const exportToJSON = () => {
    try {
      const jsonData = JSON.stringify(filteredData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('JSON exportado exitosamente');
    } catch (error) {
      toast.error('Error al exportar JSON: ' + error.message);
    }
  };

  const exportToImage = async () => {
    try {
      const element = document.getElementById('data-visualization-content');
      if (!element) {
        toast.error('Elemento no encontrado para captura');
        return;
      }
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success('Imagen exportada exitosamente');
    } catch (error) {
      toast.error('Error al exportar imagen: ' + error.message);
    }
  };

  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  if (!parsedData || parsedData.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay datos para visualizar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-gray-800">Análisis de Datos Estructurados</h3>
          
          {/* Botones de exportación */}
          <div className="flex items-center space-x-2" data-tutorial="export-buttons">
            <button
              onClick={exportToExcel}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={exportToJSON}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>JSON</span>
            </button>
            <button
              onClick={exportToImage}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Image className="w-4 h-4" />
              <span>Imagen</span>
            </button>
          </div>
        </div>

        {/* Controles de filtro y vista */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por categoría */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Modo de vista */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1" data-tutorial="visualization-modes">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow' : ''}`}
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded ${viewMode === 'cards' ? 'bg-white shadow' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`p-2 rounded ${viewMode === 'json' ? 'bg-white shadow' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Controles de columnas (solo para tabla) */}
          {viewMode === 'table' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Columnas:</span>
              {Object.entries(visibleColumns).map(([column, visible]) => (
                <button
                  key={column}
                  onClick={() => toggleColumn(column)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    visible 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {column.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
          <span>Total: {filteredData.length} elementos</span>
          <span>Categorías: {categories.length}</span>
          <span>Chunks totales: {filteredData.reduce((sum, item) => sum + (item.chunks_generados || 0), 0)}</span>
        </div>
      </div>

      {/* Contenido principal */}
      <div id="data-visualization-content" className="bg-white rounded-2xl shadow-lg border border-gray-200">
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
                <tr>
                  {visibleColumns.titulo && <th className="px-6 py-4 text-left">Título</th>}
                  {visibleColumns.categoria && <th className="px-6 py-4 text-left">Categoría</th>}
                  {visibleColumns.contenido && <th className="px-6 py-4 text-left">Contenido</th>}
                  {visibleColumns.chunks_generados && <th className="px-6 py-4 text-left">Chunks</th>}
                  {visibleColumns.palabras_clave && <th className="px-6 py-4 text-left">Palabras Clave</th>}
                  {visibleColumns.tipo_archivo && <th className="px-6 py-4 text-left">Tipo</th>}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    {visibleColumns.titulo && (
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {item.titulo || 'Sin título'}
                      </td>
                    )}
                    {visibleColumns.categoria && (
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {item.categoria || 'N/A'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.contenido && (
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {item.contenido || 'Sin contenido'}
                      </td>
                    )}
                    {visibleColumns.chunks_generados && (
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {item.chunks_generados || 0}
                        </span>
                      </td>
                    )}
                    {visibleColumns.palabras_clave && (
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(item.palabras_clave || []).slice(0, 3).map((keyword, i) => (
                            <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {keyword}
                            </span>
                          ))}
                          {(item.palabras_clave || []).length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{(item.palabras_clave || []).length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.tipo_archivo && (
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {item.tipo_archivo || 'N/A'}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === 'cards' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {item.titulo || 'Sin título'}
                  </h4>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs ml-2">
                    {item.categoria || 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {item.contenido || 'Sin contenido'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {(item.palabras_clave || []).slice(0, 2).map((keyword, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {item.chunks_generados || 0} chunks
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'json' && (
          <div className="p-6">
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(filteredData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataVisualization; 