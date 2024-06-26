interface MeasurementBase {
  id: number
  type: Mode
}

export interface Circle extends MeasurementBase {
  radius: number
  centerX: number
  centerY: number
}

export interface Line extends MeasurementBase {
  startX: number
  endX: number
  startY: number
  endY: number
}

export interface Text extends MeasurementBase {
  arrowX: number
  arrowY: number
  textX: number
  textY: number
  content: string
  editable: boolean
}

export type Mode = 'line' | 'circle' | 'text'

export type Measurement = Line | Circle | Text
