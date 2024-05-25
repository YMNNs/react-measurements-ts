import type React from 'react'
import { type FC, useEffect, useRef } from 'react'
import TextAnchor from './text-anchor.tsx'
import { type Circle } from '../../types'

export const minRadiusInPx = 3
const textOffset = 16

interface Props {
  circle: Circle
  parentWidth: number
  parentHeight: number
  measureCircle: (circle: Circle) => string
  onChange: (circle: Partial<Circle>) => void
  onCommit: (circle: Circle) => void
  onDeleteButtonClick: (circle: Circle) => void
}

const CircleMeasurement: FC<Props> = ({
  circle,
  parentHeight,
  parentWidth,
  measureCircle,
  onChange,
  onCommit,
  onDeleteButtonClick,
}) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<SVGCircleElement>(null)
  const strokeRef = useRef<SVGCircleElement>(null)
  const circleRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('blur', endDrag)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('blur', endDrag)
    }
  }, [])

  const strokeDragInProgress = useRef<boolean>(false)
  const fillDragInProgress = useRef<boolean>(false)

  const mouseXAtPress = useRef<number>(0)
  const mouseYAtPress = useRef<number>(0)
  const circleAtPress = useRef<Pick<Circle, 'centerX' | 'centerY' | 'radius'>>({ centerX: 0, centerY: 0, radius: 0 })
  const centerXAtPress = useRef<number>(0)
  const centerYAtPress = useRef<number>(0)
  const pointXAtPress = useRef<number>(0)
  const pointYAtPress = useRef<number>(0)
  const dragOccurred = useRef<boolean>(false)

  const onStrokeMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) {
      strokeDragInProgress.current = true
      event.preventDefault()
      onDragBegin(event.clientX, event.clientY)
    }
  }

  const onFillMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) {
      fillDragInProgress.current = true
      event.preventDefault()
      onDragBegin(event.clientX, event.clientY)
    }
  }

  const onDragBegin = (eventX: number, eventY: number) => {
    const root = rootRef.current!
    mouseXAtPress.current = eventX
    mouseYAtPress.current = eventY
    circleAtPress.current = circle
    centerXAtPress.current = circleAtPress.current.centerX * parentWidth
    centerYAtPress.current = circleAtPress.current.centerY * parentHeight

    const rect = root.getBoundingClientRect()
    const centerClientX = centerXAtPress.current + rect.left
    const centerClientY = centerYAtPress.current + rect.top
    const radiusAtPress = circleAtPress.current.radius * Math.sqrt(parentWidth * parentHeight)
    const theta = Math.atan2(mouseYAtPress.current - centerClientY, mouseXAtPress.current - centerClientX)
    pointXAtPress.current = radiusAtPress * Math.cos(theta)
    pointYAtPress.current = radiusAtPress * Math.sin(theta)
  }

  const onMouseMove = (event: MouseEvent) => onDrag(event.clientX, event.clientY)

  const onDrag = (eventX: number, eventY: number) => {
    if ((fillDragInProgress.current || strokeDragInProgress.current) && !dragOccurred.current) {
      dragOccurred.current = true
      toggleDragStyles()
    }

    if (strokeDragInProgress.current) {
      const newPointX = pointXAtPress.current + eventX - mouseXAtPress.current
      const newPointY = pointYAtPress.current + eventY - mouseYAtPress.current
      const radiusInPixels = Math.max(Math.hypot(newPointX, newPointY), minRadiusInPx)
      let radius = radiusInPixels

      let draggable = true

      if (circleAtPress.current.centerX + radiusInPixels / parentWidth > 1) {
        radius = (1 - circleAtPress.current.centerX) * parentWidth
        draggable = false
      }
      if (circleAtPress.current.centerX - radiusInPixels / parentWidth < 0) {
        radius = circleAtPress.current.centerX * parentWidth
        draggable = false
      }
      if (circleAtPress.current.centerY + radiusInPixels / parentHeight > 1) {
        radius = (1 - circleAtPress.current.centerY) * parentHeight
        draggable = false
      }
      if (circleAtPress.current.centerY - radiusInPixels / parentHeight < 0) {
        radius = circleAtPress.current.centerY * parentHeight
        draggable = false
      }
      if (draggable) {
        onChange({ id: circle.id, radius: radius / Math.sqrt(parentWidth * parentHeight) })
      }
    } else if (fillDragInProgress.current) {
      const radiusInPixels = circleAtPress.current.radius * Math.sqrt(parentWidth * parentHeight)
      let centerX = (centerXAtPress.current + eventX - mouseXAtPress.current) / parentWidth
      let centerY = (centerYAtPress.current + eventY - mouseYAtPress.current) / parentHeight

      if (centerX + radiusInPixels / parentWidth > 1) {
        centerX = 1 - radiusInPixels / parentWidth
      } else if (centerX < radiusInPixels / parentWidth) {
        centerX = radiusInPixels / parentWidth
      }
      if (centerY + radiusInPixels / parentHeight > 1) {
        centerY = 1 - radiusInPixels / parentHeight
      } else if (centerY < radiusInPixels / parentHeight) {
        centerY = radiusInPixels / parentHeight
      }
      onChange({ id: circle.id, centerX, centerY })
    }
  }

  const endDrag = () => {
    if (dragOccurred.current) {
      toggleDragStyles()
      dragOccurred.current = false
    }
    const anyDragAttempted = strokeDragInProgress.current || fillDragInProgress.current
    if (strokeDragInProgress.current) {
      strokeDragInProgress.current = false
    }
    if (fillDragInProgress.current) {
      fillDragInProgress.current = false
    }
    if (anyDragAttempted && didValuesChange()) {
      onCommit(circle)
    }
  }

  const onMouseUp = () => endDrag()

  const didValuesChange = () =>
    circle.centerX !== circleAtPress.current.centerX ||
    circle.centerY !== circleAtPress.current.centerY ||
    circle.radius !== circleAtPress.current.radius

  const getAnnotationLayerClassList = () => rootRef.current!.parentElement!.classList

  const toggleDragStyles = () => {
    if (strokeDragInProgress.current) {
      circleRef.current?.classList.toggle('dragged')
      strokeRef.current?.classList.toggle('dragged')
      getAnnotationLayerClassList().toggle('circle-stroke-dragged')
    }
    if (fillDragInProgress.current) {
      circleRef.current?.classList.toggle('dragged')
      fillRef.current?.classList.toggle('dragged')
      getAnnotationLayerClassList().toggle('circle-fill-dragged')
    }
    getAnnotationLayerClassList().toggle('any-dragged')
  }

  const centerX = circle.centerX * parentWidth
  const centerY = circle.centerY * parentHeight
  const radius = circle.radius * Math.sqrt(parentWidth * parentHeight)
  const textY = centerY + radius + textOffset
  const text = measureCircle(circle)

  return (
    <div className="circle-measurement" ref={rootRef}>
      <TextAnchor x={centerX} y={textY} onDeleteButtonClick={() => onDeleteButtonClick(circle)}>
        <div className="measurement-text" ref={textRef}>
          {text}
        </div>
      </TextAnchor>
      <svg className="measurement-svg">
        <g className="grabber-group">
          <circle
            className="fill-grabber"
            cx={centerX}
            cy={centerY}
            r={radius}
            ref={fillRef}
            onMouseDown={onFillMouseDown}
          />
          <circle
            className="stroke-grabber"
            cx={centerX}
            cy={centerY}
            r={radius}
            ref={strokeRef}
            onMouseDown={onStrokeMouseDown}
          />
          <circle className="circle" cx={centerX} cy={centerY} r={radius} ref={circleRef} />
        </g>
      </svg>
    </div>
  )
}

export default CircleMeasurement
