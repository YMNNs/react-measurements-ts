import { type Dispatch, type FC, type SetStateAction, useRef, useState } from 'react'
import MeasurementLayerBase from './core/measurement-layer-base.tsx'
import MeasurementButtons from './buttons/measurement-buttons.tsx'
import './measurement-layer.css'
import { type Circle, type Line, type Measurement, type Mode } from '../types'

interface Props {
  widthInPx: number
  heightInPx: number
  measurements: Measurement[]
  onChange: Dispatch<SetStateAction<Measurement[]>>
  onCommit?: (measurement: Measurement) => void
  measureLine: (line: Line) => string
  measureCircle: (circle: Circle) => string
}

const MeasurementLayer: FC<Props> = ({
  widthInPx,
  heightInPx,
  measurements,
  onChange,
  measureLine,
  measureCircle,
  onCommit,
}) => {
  const [mode, setMode] = useState<Mode | undefined>()

  const rootRef = useRef<HTMLDivElement>(null)

  const toggleMode = (_mode: Mode) => setMode(_mode === mode ? undefined : _mode)

  const _onCommit = (measurement: Measurement) => {
    setMode(undefined)
    if (onCommit) {
      onCommit(measurement)
    }
  }

  return (
    widthInPx > 0 &&
    heightInPx > 0 && (
      <div className="measurement-layer" ref={rootRef}>
        <MeasurementLayerBase
          measurements={measurements}
          onChange={onChange}
          widthInPx={widthInPx}
          heightInPx={heightInPx}
          measureLine={measureLine}
          measureCircle={measureCircle}
          mode={mode}
          onCommit={_onCommit}
        />
        <MeasurementButtons mode={mode} onClick={toggleMode} />
      </div>
    )
  )
}

export default MeasurementLayer
