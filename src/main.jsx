import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { applyPortfolioContent, readPublishedContent } from './lib/portfolioContent.js'

applyPortfolioContent(readPublishedContent())
// Apply published records before route modules compute layouts or choose a hero.
const { default: App } = await import('./App.jsx')
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
