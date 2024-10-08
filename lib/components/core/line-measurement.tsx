import type React from 'react'
import { type FC, useEffect, useRef, useState } from 'react'
import TextAnchor from './text-anchor.js'
import type { Line } from '../../types'
import { clamp } from '../../utils/measurement-utils.ts'

const edgeLength = 15
const textOffset = 16
const quarterCircle = Math.PI / 2

interface Props {
  line: Line
  parentWidth: number
  parentHeight: number
  measureLine: (line: Line) => string
  onChange: (line: Partial<Line>) => void
  onCommit: (line: Line) => void
  onDeleteButtonClick: (line: Line) => void
}

const LineMeasurement: FC<Props> = ({
  line,
  parentWidth,
  parentHeight,
  measureLine,
  onDeleteButtonClick,
  onChange,
  onCommit,
}) => {
  const [midHover, setMidHover] = useState(false)

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove)
    globalThis.addEventListener('mouseup', onMouseUp)
    window.addEventListener('blur', endDrag)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      globalThis.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('blur', endDrag)
    }
  }, [])

  const rootRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const midGrabberRef = useRef<SVGLineElement>(null)
  const midLineRef = useRef<SVGLineElement>(null)
  const startGrabberRef = useRef<SVGLineElement>(null)
  const startLineRef = useRef<SVGLineElement>(null)
  const endGrabberRef = useRef<SVGLineElement>(null)
  const endLineRef = useRef<SVGLineElement>(null)

  // Line layout:
  const startX = line.startX * parentWidth
  const startY = line.startY * parentHeight
  const endX = line.endX * parentWidth
  const endY = line.endY * parentHeight
  const deltaX = endX - startX
  const deltaY = endY - startY
  const rotate = Math.atan2(deltaY, deltaX)
  const edgeX = (edgeLength * Math.sin(rotate)) / 2
  const edgeY = (edgeLength * Math.cos(rotate)) / 2

  // Text layout (make sure the text is never rotated so much to be upside down):
  const centerX = (startX + endX) / 2
  const centerY = (startY + endY) / 2
  const rotateIsSmall = Math.abs(rotate) <= quarterCircle
  const offsetX = (rotateIsSmall ? -1 : 1) * textOffset * Math.sin(rotate)
  const offsetY = (rotateIsSmall ? 1 : -1) * textOffset * Math.cos(rotate)
  const textX = centerX + offsetX
  const textY = centerY + offsetY
  const textRotate = Math.atan2(offsetY, offsetX) - quarterCircle

  const text = measureLine(line)
  const rootClassName = 'line-measurement' + (midHover ? ' mid-hover' : '')

  const startDragInProgress = useRef<boolean>(false)
  const midDragInProgress = useRef<boolean>(false)
  const endDragInProgress = useRef<boolean>(false)
  const dragOccurred = useRef<boolean>(false)
  const mouseXAtPress = useRef<number>(0)
  const mouseYAtPress = useRef<number>(0)
  const lineAtPress = useRef<Partial<Line>>({ startX: 0, startY: 0, endX: 0, endY: 0 })
  const startXAtPress = useRef<number>(0)
  const startYAtPress = useRef<number>(0)
  const endXAtPress = useRef<number>(0)
  const endYAtPress = useRef<number>(0)

  const onStartMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) {
      startDragInProgress.current = true
      event.preventDefault()
      onDragBegin(event.clientX, event.clientY)
    }
  }

  const onMidMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) {
      midDragInProgress.current = true
      event.preventDefault()
      onDragBegin(event.clientX, event.clientY)
    }
  }

  const onEndMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) {
      endDragInProgress.current = true
      event.preventDefault()
      onDragBegin(event.clientX, event.clientY)
    }
  }

  const onDragBegin = (eventX: number, eventY: number) => {
    mouseXAtPress.current = eventX
    mouseYAtPress.current = eventY
    lineAtPress.current = line
    startXAtPress.current = line.startX * parentWidth
    startYAtPress.current = line.startY * parentHeight
    endXAtPress.current = line.endX * parentWidth
    endYAtPress.current = line.endY * parentHeight
  }

  const getXAfterDrag = (xAtPress: number, clientX: number) =>
    (xAtPress + clientX - mouseXAtPress.current) / parentWidth

  const getYAfterDrag = (yAtPress: number, clientY: number) =>
    (yAtPress + clientY - mouseYAtPress.current) / parentHeight

  const onDrag = (eventX: number, eventY: number) => {
    if (
      (startDragInProgress.current || endDragInProgress.current || midDragInProgress.current) &&
      !dragOccurred.current
    ) {
      dragOccurred.current = true
      toggleDragStyles()
    }

    if (startDragInProgress.current) {
      const startX = clamp(getXAfterDrag(startXAtPress.current, eventX))
      const startY = clamp(getYAfterDrag(startYAtPress.current, eventY))

      onChange({ id: line.id, startX, startY })
    } else if (endDragInProgress.current) {
      const endX = clamp(getXAfterDrag(endXAtPress.current, eventX))
      const endY = clamp(getYAfterDrag(endYAtPress.current, eventY))
      onChange({ id: line.id, endX, endY })
    } else if (midDragInProgress.current) {
      let startX = getXAfterDrag(startXAtPress.current, eventX)
      let startY = getYAfterDrag(startYAtPress.current, eventY)
      let endX = getXAfterDrag(endXAtPress.current, eventX)
      let endY = getYAfterDrag(endYAtPress.current, eventY)
      const deltaX = endX - startX
      const deltaY = endY - startY

      // Don't let the line be dragged outside the layer bounds:
      if (startX < 0) {
        startX = 0
        endX = deltaX
      } else if (startX > 1) {
        startX = 1
        endX = 1 + deltaX
      }
      if (startY < 0) {
        startY = 0
        endY = deltaY
      } else if (startY > 1) {
        startY = 1
        endY = 1 + deltaY
      }
      if (endX < 0) {
        startX = -deltaX
        endX = 0
      } else if (endX > 1) {
        startX = 1 - deltaX
        endX = 1
      }
      if (endY < 0) {
        startY = -deltaY
        endY = 0
      } else if (endY > 1) {
        startY = 1 - deltaY
        endY = 1
      }
      onChange({ id: line.id, startX, startY, endX, endY })
    }
  }

  const onMouseMove = (event: MouseEvent) => onDrag(event.clientX, event.clientY)

  const didValuesChange = () =>
    line.startX !== lineAtPress.current.startX ||
    line.startY !== lineAtPress.current.startY ||
    line.endX !== lineAtPress.current.endX ||
    line.endY !== lineAtPress.current.endY

  const onMidMouseEnter = () => setMidHover(true)

  const onMidMouseLeave = () => setMidHover(false)

  const getAnnotationLayerClassList = () => rootRef.current!.parentElement!.classList

  const toggleDragStyles = () => {
    if (startDragInProgress.current) {
      startLineRef.current?.classList.toggle('dragged')
      startGrabberRef.current?.classList.toggle('dragged')
      getAnnotationLayerClassList().toggle('line-start-dragged')
    }
    if (midDragInProgress.current) {
      startLineRef.current?.classList.toggle('dragged')
      midLineRef.current?.classList.toggle('dragged')
      endLineRef.current?.classList.toggle('dragged')
      startGrabberRef.current?.classList.toggle('dragged')
      midGrabberRef.current?.classList.toggle('dragged')
      endGrabberRef.current?.classList.toggle('dragged')
      getAnnotationLayerClassList().toggle('line-mid-dragged')
    }
    if (endDragInProgress) {
      endLineRef.current?.classList.toggle('dragged')
      endGrabberRef.current?.classList.toggle('dragged')
      getAnnotationLayerClassList().toggle('line-end-dragged')
    }
    getAnnotationLayerClassList().toggle('any-dragged')
  }

  const onMouseUp = () => endDrag()

  const endDrag = () => {
    if (dragOccurred.current) {
      toggleDragStyles()
      dragOccurred.current = false
    }
    const anyDragAttempted = startDragInProgress.current || midDragInProgress.current || endDragInProgress.current
    if (startDragInProgress.current) {
      startDragInProgress.current = false
    }
    if (midDragInProgress.current) {
      midDragInProgress.current = false
    }
    if (endDragInProgress.current) {
      endDragInProgress.current = false
    }
    if (anyDragAttempted && didValuesChange()) {
      onCommit(line)
    }
  }

  return (
    <div className={rootClassName} ref={rootRef}>
      <svg className="measurement-svg">
        <g className="grabber-group">
          <line
            className="grabber mid-grabber"
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            ref={midGrabberRef}
            onMouseDown={onMidMouseDown}
            onMouseEnter={onMidMouseEnter}
            onMouseLeave={onMidMouseLeave}
          />
          <line className="line mid-line" x1={startX} y1={startY} x2={endX} y2={endY} ref={midLineRef} />
        </g>
        <g className="grabber-group">
          <line
            className="grabber start-grabber"
            x1={startX - edgeX}
            y1={startY + edgeY}
            x2={startX + edgeX}
            y2={startY - edgeY}
            ref={startGrabberRef}
            onMouseDown={onStartMouseDown}
          />
          <line
            className="line start-line"
            x1={startX - edgeX}
            y1={startY + edgeY}
            x2={startX + edgeX}
            y2={startY - edgeY}
            ref={startLineRef}
          />
        </g>
        <g className="grabber-group">
          <line
            className="grabber end-grabber"
            x1={endX - edgeX}
            y1={endY + edgeY}
            x2={endX + edgeX}
            y2={endY - edgeY}
            ref={endGrabberRef}
            onMouseDown={onEndMouseDown}
          />
          <line
            className="line end-line"
            x1={endX - edgeX}
            y1={endY + edgeY}
            x2={endX + edgeX}
            y2={endY - edgeY}
            ref={endLineRef}
          />
        </g>
      </svg>
      <TextAnchor x={textX} y={textY} rotate={textRotate} onDeleteButtonClick={() => onDeleteButtonClick(line)}>
        <div className="measurement-text" ref={textRef}>
          {text}
        </div>
      </TextAnchor>
    </div>
  )
}

export default LineMeasurement
