
// Add global polyfill for react-graph-vis library
window.global = window;

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
