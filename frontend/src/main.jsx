import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux'; // 📍 引入 Provider
import { store } from './store/store';  // 📍 引入 store
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}> {/* 📍 包裹 App */}
      <App />
    </Provider>
  </StrictMode>,
);