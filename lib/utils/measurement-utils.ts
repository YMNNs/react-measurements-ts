import { type Circle, type Line } from '../types'

export const calculateDistance = (line: Line, physicalWidth: number, physicalHeight: number): number => {
  const deltaX = (line.endX - line.startX) * physicalWidth
  const deltaY = (line.endY - line.startY) * physicalHeight
  return Math.hypot(deltaX, deltaY)
}

export const calculateArea = (circle: Circle, physicalWidth: number, physicalHeight: number): number =>
  Math.PI * circle.radius * circle.radius * physicalWidth * physicalHeight

export const clamp = (value: number): number => Math.min(1, Math.max(0, value))

export const getNextId = (): number => Date.now()
