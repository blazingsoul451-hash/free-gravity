import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ShowcasePage } from './pages/ShowcasePage';
import { StudioWorkspace } from './pages/StudioWorkspace';
import './styles/tokens.css';

const AppRouter: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(
    window.location.pathname.startsWith('/app') ? '/app' : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.startsWith('/app') ? '/app' : '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#131314]">
      {currentPath === '/app' ? (
        <StudioWorkspace onNavigateHome={() => navigateTo('/')} />
      ) : (
        <ShowcasePage onLaunchApp={() => navigateTo('/app')} />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
