import React from 'react'
import ReactDOM from 'react-dom/client'
import MeasurementApp from './components/measurement-app.tsx'

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <React.StrictMode>
    <MeasurementApp />
  </React.StrictMode>,
)
