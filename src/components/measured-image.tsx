import { type FC, useEffect, useRef, useState } from 'react'

import { ContentState, EditorState } from 'draft-js'
import pollenImage from '../assets/pollen.jpg'
import { type Circle, type Line, type Measurement } from '../../lib/types'
import { calculateArea, calculateDistance } from '../../lib/utils/measurement-utils.ts'
import MeasurementLayer from '../../lib/components/measurement-layer.tsx'

interface Props {
  onImageLoaded: () => void
}

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
    editorState: EditorState.createWithContent(ContentState.createFromText('Pollen Grain')),
  },
]

const measureLine = (line: Line) => Math.round(calculateDistance(line, 300, 300)) + ' μm'

const measureCircle = (circle: Circle) => Math.round(calculateArea(circle, 300, 300) / 10) * 10 + ' μm²'

const MeasuredImage: FC<Props> = ({ onImageLoaded }) => {
  const [measurements, setMeasurements] = useState<Measurement[]>(initialState)
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
        <img src={pollenImage} alt="Pollen grains" ref={imageRef} onLoad={onLoad} />
        <MeasurementLayer
          measurements={measurements}
          widthInPx={widthInPx}
          heightInPx={heightInPx}
          onChange={setMeasurements}
          measureLine={measureLine}
          measureCircle={measureCircle}
        />
      </div>
    </div>
  )
}

export default MeasuredImage
