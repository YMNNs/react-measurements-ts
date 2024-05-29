import { type Dispatch, forwardRef, type HTMLAttributes, type SetStateAction, useState } from 'react'
import MeasurementLayerBase from './core/measurement-layer-base.tsx'
import MeasurementButtons from './buttons/measurement-buttons.tsx'
import './measurement-layer.css'
import { type Circle, type Line, type Measurement, type Mode } from '../types'

interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  measurements: Measurement[]
  onChange: Dispatch<SetStateAction<Measurement[]>>
  onCommit?: (measurement: Measurement) => void
  measureLine: (line: Line) => string
  measureCircle: (circle: Circle) => string
}

const MeasurementLayer = forwardRef<HTMLDivElement, Props>(
  ({ measurements, onChange, measureLine, measureCircle, onCommit, ...restProps }, ref) => {
    const [mode, setMode] = useState<Mode | undefined>()
    const toggleMode = (_mode: Mode) => setMode(_mode === mode ? undefined : _mode)

    const _onCommit = (measurement: Measurement) => {
      setMode(undefined)
      if (onCommit) {
        onCommit(measurement)
      }
    }

    return (
      <div className="measurement-layer" ref={ref} {...restProps}>
        <MeasurementLayerBase
          measurements={measurements}
          onChange={onChange}
          measureLine={measureLine}
          measureCircle={measureCircle}
          mode={mode}
          onCommit={_onCommit}
        />
        <MeasurementButtons mode={mode} onClick={toggleMode} />
      </div>
    )
  },
)

MeasurementLayer.displayName = 'MeasurementLayer'

export default MeasurementLayer
