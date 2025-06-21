import { createContext, useContext, useState, useEffect } from 'react';

const TutorialContext = createContext();

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial debe ser usado dentro de TutorialProvider');
  }
  return context;
};

export const TutorialProvider = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [language, setLanguage] = useState('es'); // 'es' o 'en'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  // Cargar configuración desde localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('tutorial-language');
    const completed = localStorage.getItem('tutorial-completed');
    
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    if (completed) {
      setTutorialCompleted(JSON.parse(completed));
    }
  }, []);

  // Guardar configuración en localStorage
  const saveLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('tutorial-language', lang);
  };

  const saveTutorialCompleted = (completed) => {
    setTutorialCompleted(completed);
    localStorage.setItem('tutorial-completed', JSON.stringify(completed));
  };

  const startTutorial = (page = 'dashboard') => {
    setCurrentPage(page);
    setCurrentStep(0);
    setIsRunning(true);
  };

  const stopTutorial = () => {
    setIsRunning(false);
    setCurrentStep(0);
  };

  const skipAll = () => {
    setIsRunning(false);
    setCurrentStep(0);
    saveTutorialCompleted(true);
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const completeTutorial = () => {
    setIsRunning(false);
    setCurrentStep(0);
    saveTutorialCompleted(true);
  };

  const resetTutorial = () => {
    saveTutorialCompleted(false);
    localStorage.removeItem('tutorial-completed');
  };

  const value = {
    isRunning,
    currentStep,
    language,
    currentPage,
    tutorialCompleted,
    startTutorial,
    stopTutorial,
    skipAll,
    nextStep,
    prevStep,
    completeTutorial,
    resetTutorial,
    setLanguage: saveLanguage,
    setCurrentPage
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}; 