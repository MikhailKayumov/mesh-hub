import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => console.clear());
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
