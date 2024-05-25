import { type FC, type MouseEvent } from 'react'
import { CircleIcon, RulerIcon, TextIcon } from './icons.tsx'
import { type Mode } from '../../types'

interface Props {
  mode: Mode | undefined
  onClick: (mode: Mode) => void
}

const onMouseDown = (event: MouseEvent) => {
  event.stopPropagation()
  event.preventDefault()
}

const MeasurementButtons: FC<Props> = ({ mode, onClick }) => {
  const rootClass = 'button-bar' + (mode ? ' pressed' : '')
  const lineClass = 'line-button' + (mode === 'line' ? ' pressed' : '')
  const circleClass = 'circle-button' + (mode === 'circle' ? ' pressed' : '')
  const textClass = 'text-button' + (mode === 'text' ? ' pressed' : '')

  return (
    <div className={rootClass} onMouseDown={event => onMouseDown(event)}>
      <button type="button" className={lineClass} onClick={() => onClick('line')}>
        <RulerIcon />
      </button>
      <button type="button" className={circleClass} onClick={() => onClick('circle')}>
        <CircleIcon />
      </button>
      <button type="button" className={textClass} onClick={() => onClick('text')}>
        <TextIcon />
      </button>
    </div>
  )
}

export default MeasurementButtons
