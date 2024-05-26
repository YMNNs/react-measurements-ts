import { type FC, useState } from 'react'
import { version } from '../../package.json'
import './measurement-app.css'
import MeasuredImage from './measured-image.tsx'
import type { Measurement } from '../../lib/types'

const initialState: Measurement[] = [
  {
    id: 0,
    type: 'line',
    startX: 0.183,
    startY: 0.33,
    endX: 0.316,
    endY: 0.224,
  },
  {
    id: 1,
    type: 'circle',
    centerX: 0.863,
    centerY: 0.414,
    radius: 0.0255,
  },
  {
    id: 2,
    type: 'text',
    arrowX: 0.482,
    arrowY: 0.739,
    textX: 0.54,
    textY: 0.82,
    editable: false,
    content: 'Pollen Grain',
  },
]

const MeasurementApp: FC = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>(initialState)
  const [loaded, setLoaded] = useState<boolean>(false)

  const onImageLoaded = () => setLoaded(true)

  return (
    <div className="container">
      <div className="title-bar">
        <div className="title-bar-inner">
          <span className="title-text">React Measurements TS</span>
          <div className="splitter" />
          <a href="https://www.npmjs.com/package/react-measurements-ts">v{version}</a>
          <a href="https://github.com/YMNNs/react-measurements-ts">GitHub</a>
        </div>
        <div className="mobile-readonly-message">A mouse is required for editing, sorry!</div>
      </div>
      <div className="content">
        <div className={'measurements-body' + (loaded ? ' loaded' : '')}>
          <div>
            <MeasuredImage onImageLoaded={onImageLoaded} measurements={measurements} onChange={setMeasurements} />
          </div>
          <div className={'extra'}>
            <p style={{ textAlign: 'center' }}>Fig. 1: Pollen grains under an electron microscope.</p>
          </div>
          <div className={'extra'}>
            <pre>{JSON.stringify(measurements, undefined, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MeasurementApp
