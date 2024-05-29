import { type Dispatch, type FC, type SetStateAction, useRef } from 'react'
import pollenImage from '../assets/pollen.jpg'
import { type Circle, type Line, type Measurement } from '../../lib/types'
import { calculateArea, calculateDistance, MeasurementLayer } from '../../lib/main.ts'

interface Props {
  onImageLoaded: () => void
  measurements: Measurement[]
  onChange: Dispatch<SetStateAction<Measurement[]>>
}

const measureLine = (line: Line) => Math.round(calculateDistance(line, 300, 240)) + ' μm'

const measureCircle = (circle: Circle) => Math.round(calculateArea(circle, 300, 240) / 10) * 10 + ' μm²'

const MeasuredImage: FC<Props> = ({ onImageLoaded, measurements, onChange }) => {
  const imageRef = useRef<HTMLImageElement>(null)

  const onLoad = () => {
    onImageLoaded()
  }

  return (
    <div className="square-parent">
      <div className="square-child">
        <img src={pollenImage} className={'measured-img'} alt="Pollen grains" ref={imageRef} onLoad={onLoad} />
        <MeasurementLayer
          measurements={measurements}
          onChange={onChange}
          measureLine={measureLine}
          measureCircle={measureCircle}
        />
      </div>
    </div>
  )
}

export default MeasuredImage
