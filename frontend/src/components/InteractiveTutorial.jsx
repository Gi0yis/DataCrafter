import { useEffect, useState } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import { useTutorial } from '../contexts/TutorialContext';
import { tutorialSteps } from '../data/tutorialSteps';

const InteractiveTutorial = () => {
  const location = useLocation();
  const { 
    isRunning, 
    currentStep, 
    language, 
    currentPage,
    setCurrentPage,
    stopTutorial,
    skipAll,
    completeTutorial,
    nextStep,
    prevStep
  } = useTutorial();

  const [steps, setSteps] = useState([]);

  // Actualizar página actual basada en la ruta
  useEffect(() => {
    const path = location.pathname;
    let page = 'dashboard';
    
    if (path === '/query') page = 'query';
    else if (path === '/upload') page = 'upload';
    else if (path === '/analytics') page = 'analytics';
    
    setCurrentPage(page);
  }, [location.pathname, setCurrentPage]);

  // Actualizar pasos cuando cambia la página o idioma
  useEffect(() => {
    if (currentPage && tutorialSteps[currentPage]) {
      const newSteps = tutorialSteps[currentPage][language] || [];
      console.log('Setting tutorial steps:', { currentPage, language, steps: newSteps });
      setSteps(newSteps);
    }
  }, [currentPage, language]);

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;
    
    console.log('Joyride callback:', { action, index, status, type, currentStep });

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      // Manejar navegación de pasos
      if (action === ACTIONS.NEXT) {
        console.log('Next button clicked, advancing step');
        if (index + 1 >= steps.length) {
          console.log('Tutorial completed');
          completeTutorial();
        } else {
          console.log('Moving to next step:', index + 1);
          nextStep();
        }
      } else if (action === ACTIONS.PREV) {
        console.log('Previous button clicked, going back');
        prevStep();
      } else if (action === ACTIONS.SKIP) {
        console.log('Skip button clicked');
        nextStep();
      }
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      if (status === STATUS.SKIPPED) {
        console.log('Tutorial skipped');
        skipAll();
      } else {
        console.log('Tutorial finished');
        completeTutorial();
      }
    } else if (status === STATUS.ERROR) {
      console.error('Joyride error:', data);
      // Continuar con el tutorial en caso de error
    } else if (status === STATUS.READY) {
      console.log('Tutorial ready to start');
    }
  };

  const customStyles = {
    options: {
      primaryColor: '#8B5CF6',
      textColor: '#374151',
      backgroundColor: '#ffffff',
      overlayColor: 'rgba(0, 0, 0, 0.4)',
      arrowColor: '#ffffff',
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      fontSize: '16px',
      padding: '24px',
      maxWidth: '450px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '12px',
      color: '#1F2937',
      lineHeight: '1.3',
    },
    tooltipContent: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#4B5563',
      marginBottom: '20px',
    },
    buttonNext: {
      backgroundColor: '#8B5CF6',
      borderRadius: '12px',
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: '600',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    buttonBack: {
      backgroundColor: 'transparent',
      border: '2px solid #D1D5DB',
      borderRadius: '12px',
      padding: '10px 20px',
      fontSize: '16px',
      fontWeight: '500',
      color: '#6B7280',
      cursor: 'pointer',
      marginRight: '12px',
      transition: 'all 0.2s ease',
    },
    buttonSkip: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#9CA3AF',
      fontSize: '14px',
      cursor: 'pointer',
      textDecoration: 'underline',
      padding: '8px 12px',
      fontWeight: '500',
    },
    buttonClose: {
      backgroundColor: '#F3F4F6',
      border: 'none',
      color: '#6B7280',
      fontSize: '18px',
      cursor: 'pointer',
      position: 'absolute',
      right: '12px',
      top: '12px',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
    },
    spotlight: {
      borderRadius: '12px',
    },
    overlay: {
      mixBlendMode: 'normal',
    },
  };

  const locale = {
    back: language === 'es' ? '← Atrás' : '← Back',
    close: language === 'es' ? '✕ Cerrar' : '✕ Close',
    last: language === 'es' ? '🎉 Finalizar' : '🎉 Finish',
    next: language === 'es' ? 'Siguiente →' : 'Next →',
    skip: language === 'es' ? 'Omitir paso' : 'Skip step',
  };

  if (!isRunning || steps.length === 0) {
    return null;
  }

  return (
    <div>
      <Joyride
        steps={steps}
        run={isRunning}
        stepIndex={currentStep}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        disableOverlayClose={false}
        disableScrollParentFix={true}
        spotlightClicks={false}
        callback={handleJoyrideCallback}
        styles={customStyles}
        locale={locale}
        floaterProps={{
          disableAnimation: false,
        }}
      />
      
      {/* Controles flotantes del tutorial */}
      {isRunning && (
        <div className="fixed bottom-6 left-6 z-[10001] flex flex-col space-y-3">
          {/* Indicador de progreso */}
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-purple-600 font-medium">
                {language === 'es' ? 'Paso' : 'Step'} {currentStep + 1} / {steps.length}
              </span>
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Botón omitir todo */}
          <button
            onClick={skipAll}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-200 text-sm font-medium flex items-center space-x-2"
          >
            <span>⏭️</span>
            <span>{language === 'es' ? 'Omitir todo' : 'Skip all'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default InteractiveTutorial; 