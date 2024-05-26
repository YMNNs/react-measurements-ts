import { type Dispatch, type FC, type SetStateAction, useEffect, useRef, useState } from 'react'
import pollenImage from '../assets/pollen.jpg'
import { type Circle, type Line, type Measurement } from '../../lib/types'
import { calculateArea, calculateDistance } from '../../lib/utils/measurement-utils.ts'
import MeasurementLayer from '../../lib/components/measurement-layer.tsx'

interface Props {
  onImageLoaded: () => void
  measurements: Measurement[]
  onChange: Dispatch<SetStateAction<Measurement[]>>
}

const measureLine = (line: Line) => Math.round(calculateDistance(line, 300, 240)) + ' μm'

const measureCircle = (circle: Circle) => Math.round(calculateArea(circle, 300, 240) / 10) * 10 + ' μm²'

const MeasuredImage: FC<Props> = ({ onImageLoaded, measurements, onChange }) => {
  const [widthInPx, setWidthInPx] = useState<number>(0)
  const [heightInPx, setHeightInPx] = useState<number>(0)

  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    window.addEventListener('resize', onImageBoundsChanged)
    return () => {
      window.addEventListener('resize', onImageBoundsChanged)
    }
  }, [])

  const onImageBoundsChanged = () => {
    const imageBounds = imageRef.current!.getBoundingClientRect()
    setWidthInPx(imageBounds.width)
    setHeightInPx(imageBounds.height)
  }

  const onLoad = () => {
    onImageBoundsChanged()
    onImageLoaded()
  }

  return (
    <div className="square-parent">
      <div className="square-child">
        <img src={pollenImage} className={'measured-img'} alt="Pollen grains" ref={imageRef} onLoad={onLoad} />
        <MeasurementLayer
          measurements={measurements}
          widthInPx={widthInPx}
          heightInPx={heightInPx}
          onChange={onChange}
          measureLine={measureLine}
          measureCircle={measureCircle}
        />
      </div>
    </div>
  )
}

export default MeasuredImage
