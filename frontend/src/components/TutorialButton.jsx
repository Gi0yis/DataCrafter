import { useState } from 'react';
import { HelpCircle, Play, RotateCcw, Globe } from 'lucide-react';
import { useTutorial } from '../contexts/TutorialContext';
import { useLocation, useNavigate } from 'react-router-dom';

const TutorialButton = () => {
  const [showMenu, setShowMenu] = useState(false);
  const { 
    startTutorial, 
    language, 
    setLanguage, 
    tutorialCompleted,
    resetTutorial 
  } = useTutorial();
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/query') return 'query';
    if (path === '/upload') return 'upload';
    if (path === '/analytics') return 'analytics';
    return 'dashboard';
  };

  const handleStartTutorial = (page = null) => {
    const targetPage = page || getCurrentPage();
    
    // Si no estamos en la página correcta, navegar primero
    if (page && page !== getCurrentPage()) {
      const routes = {
        dashboard: '/',
        query: '/query',
        upload: '/upload',
        analytics: '/analytics'
      };
      navigate(routes[page]);
      // Pequeño delay para que la navegación se complete
      setTimeout(() => {
        startTutorial(page);
      }, 100);
    } else {
      startTutorial(targetPage);
    }
    
    setShowMenu(false);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowMenu(false);
  };

  const handleResetTutorial = () => {
    resetTutorial();
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors duration-200 rounded-lg hover:bg-purple-50"
        aria-label="Tutorial"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="hidden md:inline text-sm font-medium">Tutorial</span>
      </button>

      {showMenu && (
        <>
          {/* Overlay para cerrar el menú */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menú desplegable */}
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3">
              <h3 className="text-white font-semibold text-sm">
                {language === 'es' ? 'Tutorial Interactivo' : 'Interactive Tutorial'}
              </h3>
              <p className="text-purple-100 text-xs mt-1">
                {language === 'es' 
                  ? 'Aprende a usar DataCrafter paso a paso' 
                  : 'Learn to use DataCrafter step by step'}
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Selector de idioma */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Idioma' : 'Language'}
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLanguageChange('es')}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                      language === 'es' 
                        ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🇪🇸 Español
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                      language === 'en' 
                        ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>

              {/* Botones de tutorial por página */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Iniciar Tutorial' : 'Start Tutorial'}
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => handleStartTutorial('dashboard')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-left bg-gray-50 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => handleStartTutorial('query')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-left bg-gray-50 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>{language === 'es' ? 'Consultar' : 'Query'}</span>
                  </button>
                  <button
                    onClick={() => handleStartTutorial('upload')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-left bg-gray-50 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>{language === 'es' ? 'Subir' : 'Upload'}</span>
                  </button>
                  <button
                    onClick={() => handleStartTutorial('analytics')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-left bg-gray-50 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Analytics</span>
                  </button>
                </div>
              </div>

              {/* Botón para página actual */}
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={() => handleStartTutorial()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <Play className="w-4 h-4" />
                  <span>
                    {language === 'es' 
                      ? 'Tutorial de esta página' 
                      : 'Tutorial for this page'}
                  </span>
                </button>
              </div>

              {/* Botón de reiniciar si ya se completó */}
              {tutorialCompleted && (
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={handleResetTutorial}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {language === 'es' 
                        ? 'Reiniciar tutorial' 
                        : 'Reset tutorial'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TutorialButton; 