import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { TutorialProvider } from './contexts/TutorialContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import QueryPage from './pages/QueryPage';
import UploadPage from './pages/UploadPage';
import AnalyticsPage from './pages/AnalyticsPage';
import InteractiveTutorial from './components/InteractiveTutorial';

function App() {
  return (
    <Router>
      <TutorialProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/query" element={<QueryPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </main>
          <InteractiveTutorial />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </TutorialProvider>
    </Router>
  );
}

export default App;
