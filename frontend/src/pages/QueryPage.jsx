import { useState } from 'react';
import { Send, Brain, MessageCircle, Trash2 } from 'lucide-react';
import { queryService } from '../services/api';
import { persistenceService } from '../services/persistence';
import toast from 'react-hot-toast';

const QueryPage = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [connectionTesting, setConnectionTesting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error('Por favor ingresa una pregunta');
      return;
    }

    try {
      setLoading(true);
      setLoadingStatus('Procesando consulta...');
      
      const response = await queryService.query(question);
      
      // Manejo de la respuesta del backend
      console.log('Processing response:', response);
      
      const answerText = response?.answer || 'Sin respuesta disponible';
      
      const newMessage = {
        id: Date.now(),
        question,
        answer: answerText,
        timestamp: new Date().toISOString(),
      };

      setChatHistory(prev => [newMessage, ...prev]);
      setAnswer(answerText);
      setQuestion('');
      setLoadingStatus('');
      
      // Actualizar métricas de persistencia
      persistenceService.processQuery();
      
      toast.success('Consulta procesada exitosamente');
    } catch (error) {
      setLoadingStatus('');
      toast.error(error.message || 'Error al procesar la consulta');
      console.error('Chat Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setConnectionTesting(true);
      console.log('Testing connection to backend...');
      
      const response = await queryService.query('¿Puedes responder esta pregunta de prueba?');
      
      // Mostrar información detallada sobre la respuesta
      console.log('Raw test response:', response);
      
      if (response?.answer) {
        toast.success('¡Conexión exitosa con el backend!');
        console.log('Backend responded with answer:', response.answer);
      } else {
        toast.error('⚠️ Conexión establecida pero sin respuesta válida');
        console.warn('No answer field in response:', response);
      }
      
    } catch (error) {
      toast.error('Error de conexión: ' + error.message);
      console.error('Connection test failed:', error);
    } finally {
      setConnectionTesting(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    setAnswer('');
    toast.success('Chat limpiado exitosamente');
  };

  const exampleQuestions = [
    "¿Cuáles son los principales puntos del documento?",
    "¿Qué conclusiones se pueden extraer?",
    "¿Cuáles son las recomendaciones principales?",
    "¿Qué metodología se utilizó en el estudio?",
    "¿Cuáles son los resultados más importantes?",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header Mejorado */}
        <div className="text-center relative" data-tutorial="query-header">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 blur-xl"></div>
          </div>
          <div className="relative">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-md opacity-30"></div>
                <div className="relative p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-xl">
                  <Brain className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Consulta Inteligente
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Haz preguntas sobre tus documentos y obtén respuestas precisas basadas en IA avanzada
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Sistema activo y listo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface Mejorado */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Chat Inteligente</h2>
                      <p className="text-blue-100 text-sm">Conversación con IA</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={clearChat}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title="Limpiar chat"
                      data-tutorial="clear-button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-blue-100">En línea</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 h-96 flex flex-col">
                {/* Chat History Mejorado */}
                <div className="flex-1 overflow-y-auto space-y-6 mb-6 px-2 custom-scrollbar" data-tutorial="chat-interface">
                  {chatHistory.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 blur-xl"></div>
                        <div className="relative p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl">
                          <Brain className="w-16 h-16 text-gray-400" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-gray-700">¡Empecemos a conversar!</h3>
                        <p className="text-gray-500">Haz tu primera pregunta para comenzar</p>
                        <div className="flex items-center justify-center space-x-1 mt-4">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {chatHistory.map((message, index) => (
                        <div key={message.id} className="space-y-4 animate-fade-in">
                          {/* Question - Usuario */}
                          <div className="flex justify-end">
                            <div className="relative group">
                              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-br-md px-6 py-4 max-w-xs lg:max-w-md shadow-lg">
                                <p className="text-sm leading-relaxed">{message.question}</p>
                                <div className="text-xs text-blue-100 mt-2 opacity-75">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                              <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[12px] border-l-purple-600 border-t-[12px] border-t-transparent"></div>
                            </div>
                          </div>
                          
                          {/* Answer - IA */}
                          <div className="flex justify-start">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                <Brain className="w-4 h-4 text-white" />
                              </div>
                              <div className="relative group">
                                <div className="bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-md px-6 py-4 max-w-xs lg:max-w-md shadow-lg">
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.answer}</p>
                                  <div className="text-xs text-gray-400 mt-2">
                                    IA · {new Date(message.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                                <div className="absolute -bottom-2 -left-2 w-0 h-0 border-r-[12px] border-r-white border-t-[12px] border-t-transparent"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  
                      {/* Loading indicator mejorado */}
                      {loading && (
                        <div className="space-y-4 animate-fade-in">
                          <div className="flex justify-end">
                            <div className="relative group">
                              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-br-md px-6 py-4 max-w-xs lg:max-w-md shadow-lg">
                                <p className="text-sm leading-relaxed">{question}</p>
                              </div>
                              <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[12px] border-l-purple-600 border-t-[12px] border-t-transparent"></div>
                            </div>
                          </div>
                          <div className="flex justify-start">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                                <Brain className="w-4 h-4 text-white" />
                              </div>
                              <div className="relative group">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-800 rounded-2xl rounded-bl-md px-6 py-4 shadow-lg">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex space-x-1">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                      {loadingStatus || 'Analizando tu pregunta...'}
                                    </span>
                                  </div>
                                </div>
                                <div className="absolute -bottom-2 -left-2 w-0 h-0 border-r-[12px] border-r-gray-100 border-t-[12px] border-t-transparent"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Input Form Mejorado */}
                <form onSubmit={handleSubmit} className="relative">
                  <div className="flex items-center bg-gray-50 rounded-2xl border-2 border-gray-200 focus-within:border-purple-500 focus-within:bg-white transition-all duration-300 shadow-sm">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Escribe tu pregunta aquí..."
                      className="flex-1 px-6 py-4 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-500"
                      disabled={loading}
                      data-tutorial="input-area"
                    />
                    <div className="flex items-center space-x-2 px-4">
                      <div className="text-xs text-gray-400 hidden sm:block">
                        Enter para enviar
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !question.trim()}
                        className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        data-tutorial="send-button"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar Mejorada */}
          <div className="space-y-6">
            {/* Example Questions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Preguntas Rápidas</h3>
              </div>
              <div className="space-y-3">
                {exampleQuestions.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestion(example)}
                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group transform hover:scale-[1.02] shadow-sm hover:shadow-md"
                  >
                    <p className="text-sm text-gray-700 group-hover:text-gray-800 leading-relaxed">{example}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Test */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-xl">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Estado del Sistema</h3>
              </div>
              <button
                onClick={testConnection}
                disabled={connectionTesting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                {connectionTesting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verificando...</span>
                  </div>
                ) : (
                  'Probar Conexión'
                )}
              </button>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Verifica si el backend está respondiendo correctamente
              </p>
            </div>

            {/* Tips */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl">
                  <Brain className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Consejos Pro</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700 leading-relaxed">Haz preguntas específicas para obtener respuestas más precisas</p>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border border-green-100">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700 leading-relaxed">Puedes preguntar sobre cualquier aspecto de tus documentos</p>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700 leading-relaxed">Las respuestas se basan en el contenido procesado por IA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryPage; 