import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => console.clear());
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
