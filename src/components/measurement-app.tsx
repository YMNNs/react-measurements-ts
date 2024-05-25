import { type FC, useState } from 'react'
import { version } from '../../package.json'
import './measurement-app.css'
import MeasuredImage from './measured-image.tsx'

const MeasurementApp: FC = () => {
  const [loaded, setLoaded] = useState<boolean>(false)

  const onImageLoaded = () => setLoaded(true)

  return (
    <div className="container">
      <div className="title-bar">
        <div className="title-bar-inner">
          <span className="title-text">React Measurements</span>
          <div className="splitter" />
          <a href="https://www.npmjs.com/package/react-measurements-ts">v{version}</a>
          <a href="https://github.com/YMNNs/react-measurements-ts">GitHub</a>
        </div>
        <div className="mobile-readonly-message">A mouse is required for editing, sorry!</div>
      </div>
      <div className="content">
        <div className={'measurements-body' + (loaded ? ' loaded' : '')}>
          <div>
            <MeasuredImage onImageLoaded={onImageLoaded} />
          </div>
          <p>Fig. 1: Pollen grains under an electron microscope.</p>
        </div>
      </div>
    </div>
  )
}

export default MeasurementApp
