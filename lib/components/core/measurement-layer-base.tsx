import type React from 'react'
import { useState } from 'react'
import { type Dispatch, type FC, type SetStateAction, useEffect, useRef } from 'react'
import LineMeasurement from './line-measurement.js'
import TextAnnotation from './text-annotation.tsx'
import './measurement-layer-base.css'
import { type Circle, type Line, type Measurement, type Mode, type Text } from '../../types'
import { clamp, getNextId } from '../../utils/measurement-utils.ts'
import CircleMeasurement, { minRadiusInPx } from './circle-measurement.tsx'

interface Props {
  mode: Mode | undefined
  measurements: Measurement[]
  measureLine: (line: Line) => string
  measureCircle: (circle: Circle) => string
  onCommit: (measurement: Measurement) => void
  onChange: Dispatch<SetStateAction<Measurement[]>>
}

const finishEdit = (text: Text) => ({
  ...text,
  editable: false,
})

const MeasurementLayerBase: FC<Props> = ({ mode, measurements, measureLine, measureCircle, onCommit, onChange }) => {
  const createdId = useRef<number>()
  const rootRef = useRef<HTMLDivElement>(null)
  const [widthInPx, setWidthInPx] = useState<number>(0)
  const [heightInPx, setHeightInPx] = useState<number>(0)
  const [ready, setReady] = useState<boolean>(false)

  const widthInPxLatest = useRef<number>(widthInPx)
  const heightInPxLatest = useRef<number>(heightInPx)

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove)
    globalThis.addEventListener('mouseup', onMouseUp)
    window.addEventListener('blur', endDrag)
    if (rootRef.current) {
      setWidthInPx(rootRef.current.clientWidth)
      setHeightInPx(rootRef.current.clientHeight)
      setReady(true)
    }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        widthInPxLatest.current = width
        heightInPxLatest.current = height
        setWidthInPx(width)
        setHeightInPx(height)
      }
    })

    if (rootRef.current) {
      observer.observe(rootRef.current)
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      globalThis.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('blur', endDrag)
      observer.disconnect()
    }
  }, [])

  const createMeasurementComponent = (measurement: Measurement) => {
    switch (measurement.type) {
      case 'line': {
        return (
          <LineMeasurement
            key={measurement.id}
            line={measurement as Line}
            parentWidth={widthInPx}
            parentHeight={heightInPx}
            measureLine={measureLine}
            onChange={_onChange}
            onCommit={onCommit}
            onDeleteButtonClick={_delete}
          />
        )
      }
      case 'circle': {
        return (
          <CircleMeasurement
            key={measurement.id}
            circle={measurement as Circle}
            parentWidth={widthInPx}
            parentHeight={heightInPx}
            measureCircle={measureCircle}
            onChange={_onChange}
            onCommit={onCommit}
            onDeleteButtonClick={_delete}
          />
        )
      }
      case 'text': {
        return (
          <TextAnnotation
            key={measurement.id}
            text={measurement as Text}
            parentWidth={widthInPx}
            parentHeight={heightInPx}
            onChange={_onChange}
            onCommit={onCommit}
            onDeleteButtonClick={_delete}
          />
        )
      }
      default: {
        return false
      }
    }
  }

  const circleCreationInProgress = useRef<boolean>(false)
  const lineCreationInProgress = useRef<boolean>(false)
  const mouseXAtPress = useRef<number>(0)
  const mouseYAtPress = useRef<number>(0)

  const onMouseDown = (event: React.MouseEvent) => {
    finishAnyTextEdit()
    if (event.button === 0) {
      if (mode === 'line') {
        event.preventDefault()
        lineCreationInProgress.current = true
        mouseXAtPress.current = event.clientX
        mouseYAtPress.current = event.clientY
      } else if (mode === 'circle') {
        event.preventDefault()
        circleCreationInProgress.current = true
        mouseXAtPress.current = event.clientX
        mouseYAtPress.current = event.clientY
      }
    }
  }

  const previousCenterX = useRef<number>(0)
  const previousCenterY = useRef<number>(0)

  const onMouseMove = (event: MouseEvent) => {
    if (lineCreationInProgress.current) {
      const rect = rootRef.current!.getBoundingClientRect()
      const endX = clamp((event.clientX - rect.left) / widthInPxLatest.current)
      const endY = clamp((event.clientY - rect.top) / heightInPxLatest.current)
      if (createdId.current) {
        _onChange({ id: createdId.current, endX, endY })
      } else {
        createdId.current = getNextId()
        const startX = clamp((mouseXAtPress.current - rect.left) / widthInPxLatest.current)
        const startY = clamp((mouseYAtPress.current - rect.top) / heightInPxLatest.current)
        const line: Measurement = {
          id: createdId.current,
          type: 'line',
          startX,
          startY,
          endX,
          endY,
        }
        rootRef.current!.classList.add('line-end-dragged')
        onChange(prevState => [...prevState, line])
      }
    } else if (circleCreationInProgress.current) {
      const rect = rootRef.current!.getBoundingClientRect()
      const cursorX = event.clientX - rect.left
      const cursorY = event.clientY - rect.top
      if (createdId.current) {
        const radius = calculateRadius(cursorX, cursorY, previousCenterX.current, previousCenterY.current)
        _onChange({ id: createdId.current, radius } as Measurement)
      } else {
        createdId.current = getNextId()
        const centerX = clamp((mouseXAtPress.current - rect.left) / widthInPxLatest.current)
        previousCenterX.current = centerX
        const centerY = clamp((mouseYAtPress.current - rect.top) / heightInPxLatest.current)
        previousCenterY.current = centerY
        const radius = calculateRadius(cursorX, cursorY, centerX, centerY)
        const circle: Measurement = {
          id: createdId.current,
          type: 'circle',
          centerX,
          centerY,
          radius,
        }
        rootRef.current!.classList.add('circle-stroke-dragged')
        onChange(prevState => [...prevState, circle])
      }
    }
  }

  const calculateRadius = (cursorX: number, cursorY: number, centerX: number, centerY: number) => {
    const deltaX = cursorX - centerX * widthInPxLatest.current
    const deltaY = cursorY - centerY * heightInPxLatest.current
    let radius = Math.max(Math.hypot(deltaX, deltaY), minRadiusInPx)

    const w = widthInPxLatest.current
    const h = heightInPxLatest.current

    if (centerX + radius / w > 1) {
      radius = (1 - centerX) * w
    }
    if (centerX - radius / w < 0) {
      radius = centerX * w
    }
    if (centerY + radius / h > 1) {
      radius = (1 - centerY) * h
    }
    if (centerY - radius / h < 0) {
      radius = centerY * h
    }
    return radius / Math.sqrt(w * h)
  }

  const onMouseUp = () => endDrag()

  const endDrag = () => {
    if (lineCreationInProgress.current) {
      lineCreationInProgress.current = false
      if (createdId.current) {
        rootRef.current!.classList.remove('line-end-dragged')
      }
    } else if (circleCreationInProgress.current) {
      circleCreationInProgress.current = false
      if (createdId.current) {
        rootRef.current!.classList.remove('circle-stroke-dragged')
      }
    }
    if (createdId.current) {
      onCommit(measurements.find(a => a.id === createdId.current)!)
      createdId.current = undefined
    }
  }

  const onClick = (event: React.MouseEvent) => {
    if (mode === 'text') {
      const id = getNextId()
      const rect = rootRef.current!.getBoundingClientRect()
      const arrowX = (event.clientX - rect.left) / widthInPxLatest.current
      const arrowY = (event.clientY - rect.top) / heightInPxLatest.current
      const xOffsetDirection = arrowX < 0.8 ? 1 : -1
      const yOffsetDirection = arrowY < 0.8 ? 1 : -1
      const textX = arrowX + xOffsetDirection * 0.05
      const textY = arrowY + yOffsetDirection * 0.07
      const text: Measurement = {
        id,
        type: 'text',
        arrowX,
        arrowY,
        textX,
        textY,
        content: '',
        editable: true,
      }
      onChange(prevState => [...prevState, text])
      onCommit(text)
    }
  }

  const _onChange = (m: Partial<Measurement>) => {
    onChange(prevState => prevState.map(n => (m.id === n.id ? { ...n, ...m } : n)))
  }

  const _delete = (m: Measurement) => {
    onChange(prevState => prevState.filter(n => n.id !== m.id))
    onCommit(m)
  }

  const finishAnyTextEdit = () => {
    const editable = measurements.find(m => m.type === 'text' && (m as Text).editable)
    if (editable) {
      onChange(prevState => prevState.map(m => (m === editable ? finishEdit(m as Text) : m)))
    }
  }

  return (
    <div
      className={'measurement-layer-base' + (mode ? ' any-mode-on' : '')}
      ref={rootRef}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      {ready && measurements.map(element => createMeasurementComponent(element))}
    </div>
  )
}

export default MeasurementLayerBase
