import type React from 'react'
import { type FC, useEffect, useRef, useState } from 'react'
import Draft, { ContentState, Editor, EditorState } from 'draft-js'
import TextAnchor from './text-anchor.js'
import { type Text } from '../../types'
import { clamp } from '../../utils/measurement-utils.ts'
import DraftEditor = Draft.DraftComponent.Base.DraftEditor

const headWidth = 8
const headHeight = 5
const headHoverWidth = 10
const headHoverHeight = 6
const headHoverOffset = 1.5
const headGrabberWidth = 15
const headGrabberHeight = 9
const headGrabberOffset = 3

interface Props {
  text: Text
  parentWidth: number
  parentHeight: number
  onChange: (text: Partial<Text>) => void
  onCommit: (text: Text) => void
  onDeleteButtonClick: (text: Text) => void
}

const TextAnnotation: FC<Props> = ({ text, parentHeight, parentWidth, onChange, onCommit, onDeleteButtonClick }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const maskRectRef = useRef<SVGRectElement>(null)
  const lineGrabberRef = useRef<SVGLineElement>(null)
  const headGrabberRef = useRef<SVGPathElement>(null)
  const headRef = useRef<SVGPathElement>(null)
  const lineRef = useRef<SVGPathElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<DraftEditor>(null)

  const propagateTextChanges = useRef<boolean>(false)
  const textDragInProgress = useRef<boolean>(false)
  const lineDragInProgress = useRef<boolean>(false)
  const headDragInProgress = useRef<boolean>(false)
  const dragOccurred = useRef<boolean>(false)
  const editorStateRef = useRef<EditorState>(EditorState.createWithContent(ContentState.createFromText(text.content)))

  const [lineHover, setLineHover] = useState<boolean>(false)
  const [headHover, setHeadHover] = useState<boolean>(false)
  const [lineDragged, setLineDragged] = useState<boolean>(false)
  const [headDragged, setHeadDragged] = useState<boolean>(false)

  useEffect(() => {
    updateMask()
    if (!text.editable) {
      propagateTextChanges.current = false
    }
  })

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('keydown', onDocumentKeyDown, true)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('blur', endDrag)
    updateMask()
    if (editorRef.current && text.editable) {
      propagateTextChanges.current = true
      editorRef.current.focus()
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('keydown', onDocumentKeyDown, true)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('blur', endDrag)
    }
  }, [])

  const drawHead = (
    pointX: number,
    pointY: number,
    w: number,
    h: number,
    rotate: number,
    offset: number,
    cos: number,
    sin: number,
  ): { path: string; transform: string } => {
    const x = pointX + offset * cos
    const y = pointY + offset * sin
    const path = `M ${x - w} ${y - h} L ${x} ${y} L ${x - w} ${y + h} Z`
    const rotateInDegrees = (rotate * 180) / Math.PI
    const transform = `rotate(${rotateInDegrees} ${x} ${y})`
    return { path, transform }
  }

  const updateMask = () => {
    const rootBox = rootRef.current!.getBoundingClientRect()
    const textBox = textRef.current!.getBoundingClientRect()

    maskRectRef.current!.setAttribute('x', `${textBox.left - rootBox.left}`)
    maskRectRef.current!.setAttribute('y', `${textBox.top - rootBox.top}`)
    maskRectRef.current!.setAttribute('width', `${textBox.width}`)
    maskRectRef.current!.setAttribute('height', `${textBox.height}`)
  }

  const onTextMouseDown = (event: React.MouseEvent) => {
    if (text.editable) {
      event.stopPropagation()
    } else if (event.button === 0) {
      textDragInProgress.current = true
      event.preventDefault()
      onDragBegin(event.clientX, event.clientY)
    }
  }

  const onLineMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) {
      lineDragInProgress.current = true
      event.preventDefault()
      onDragBegin(event.clientX, event.clientY)
      if (text.editable) {
        event.stopPropagation()
      }
    }
  }

  const onHeadMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) {
      headDragInProgress.current = true
      event.preventDefault()
      onDragBegin(event.clientX, event.clientY)
      if (text.editable) {
        event.stopPropagation()
      }
    }
  }

  const onDocumentKeyDown = (event: KeyboardEvent) => {
    if (text.editable && (event.key === 'Escape' || (event.key === 'Enter' && !event.shiftKey))) {
      event.stopPropagation()
      finishEdit()
    }
  }

  const finishEdit = () => {
    onChange({ id: text.id, editable: false })
  }

  const onMouseMove = (event: MouseEvent) => onDrag(event.clientX, event.clientY)

  const onDrag = (eventX: number, eventY: number) => {
    if ((textDragInProgress.current || lineDragInProgress.current || headDragInProgress.current) && text.editable) {
      finishEdit()
    }

    if (
      (textDragInProgress.current || lineDragInProgress.current || headDragInProgress.current) &&
      !dragOccurred.current
    ) {
      dragOccurred.current = true
      toggleDragStyles()
    }

    if (headDragInProgress.current) {
      const arrowX = clamp(getXAfterDrag(arrowXAtPress.current, eventX))
      const arrowY = clamp(getYAfterDrag(arrowYAtPress.current, eventY))
      onChange({ id: text.id, arrowX, arrowY })
    } else if (textDragInProgress.current) {
      const textX = clamp(getXAfterDrag(textXAtPress.current, eventX))
      const textY = clamp(getYAfterDrag(textYAtPress.current, eventY))
      onChange({ id: text.id, textX, textY })
    } else if (lineDragInProgress.current) {
      let arrowX = getXAfterDrag(arrowXAtPress.current, eventX)
      let arrowY = getYAfterDrag(arrowYAtPress.current, eventY)
      let textX = getXAfterDrag(textXAtPress.current, eventX)
      let textY = getYAfterDrag(textYAtPress.current, eventY)
      const deltaX = textX - arrowX
      const deltaY = textY - arrowY

      if (arrowX < 0) {
        arrowX = 0
        textX = deltaX
      } else if (arrowX > 1) {
        arrowX = 1
        textX = 1 + deltaX
      }
      if (arrowY < 0) {
        arrowY = 0
        textY = deltaY
      } else if (arrowY > 1) {
        arrowY = 1
        textY = 1 + deltaY
      }
      if (textX < 0) {
        arrowX = -deltaX
        textX = 0
      } else if (textX > 1) {
        arrowX = 1 - deltaX
        textX = 1
      }
      if (textY < 0) {
        arrowY = -deltaY
        textY = 0
      } else if (textY > 1) {
        arrowY = 1 - deltaY
        textY = 1
      }
      onChange({ id: text.id, arrowX, arrowY, textX, textY })
    }
  }

  const getXAfterDrag = (xAtPress: number, clientX: number) =>
    (xAtPress + clientX - mouseXAtPress.current) / parentWidth

  const getYAfterDrag = (yAtPress: number, clientY: number) =>
    (yAtPress + clientY - mouseYAtPress.current) / parentHeight

  const onMouseUp = () => endDrag()

  const endDrag = () => {
    if (dragOccurred.current) {
      toggleDragStyles()
      dragOccurred.current = false
    }

    const anyDragAttempted = textDragInProgress.current || lineDragInProgress.current || headDragInProgress.current
    if (textDragInProgress.current) {
      textDragInProgress.current = false
    }
    if (lineDragInProgress.current) {
      lineDragInProgress.current = false
    }
    if (headDragInProgress.current) {
      headDragInProgress.current = false
    }
    if (anyDragAttempted && didValuesChange()) {
      onCommit(text)
    }
  }

  const didValuesChange = () =>
    text.arrowX !== textAtPress.current?.arrowX ||
    text.arrowY !== textAtPress.current?.arrowY ||
    text.textX !== textAtPress.current?.textX ||
    text.textY !== textAtPress.current?.textY

  const toggleDragStyles = () => {
    getAnnotationLayerClassList().toggle('any-dragged')
    if (textDragInProgress.current) {
      getAnnotationLayerClassList().toggle('text-dragged')
    } else if (lineDragInProgress.current) {
      getAnnotationLayerClassList().toggle('arrow-line-dragged')
      setLineDragged(prevState => !prevState)
    } else if (headDragInProgress.current) {
      getAnnotationLayerClassList().toggle('arrow-head-dragged')
      setHeadDragged(prevState => !prevState)
    }
  }

  const onLineMouseEnter = () => setLineHover(true)

  const onLineMouseLeave = () => setLineHover(false)

  const onHeadMouseEnter = () => setHeadHover(true)

  const onHeadMouseLeave = () => setHeadHover(false)

  const getAnnotationLayerClassList = () => rootRef.current!.parentElement!.classList

  const onDoubleClick = (event: React.MouseEvent) => {
    if (event.button === 0) {
      event.preventDefault()
      startEdit()
    }
  }

  const onTextChange = (editorState: EditorState) => {
    if (propagateTextChanges.current) {
      editorStateRef.current = editorState
      onChange({ id: text.id, content: editorState.getCurrentContent().getPlainText() })
    }
  }

  const contentStateOnEditStart = useRef<ContentState>()

  const startEdit = () => {
    if (!text.editable) {
      contentStateOnEditStart.current = editorStateRef.current.getCurrentContent()
      setEditState(true)
    }
  }

  const setEditState = (editable: boolean) => {
    propagateTextChanges.current = editable
    // Note: selection change is also important when we finish editing because it clears the selection.
    editorStateRef.current = EditorState.moveFocusToEnd(EditorState.moveSelectionToEnd(editorStateRef.current))
    onChange({ id: text.id, editable })
  }

  const _onDeleteButtonClick = () => onDeleteButtonClick(text)

  const mouseXAtPress = useRef<number>(0)
  const mouseYAtPress = useRef<number>(0)
  const textAtPress = useRef<Text>()
  const arrowXAtPress = useRef<number>(0)
  const arrowYAtPress = useRef<number>(0)
  const textXAtPress = useRef<number>(0)
  const textYAtPress = useRef<number>(0)

  const onDragBegin = (eventX: number, eventY: number) => {
    mouseXAtPress.current = eventX
    mouseYAtPress.current = eventY
    textAtPress.current = text
    arrowXAtPress.current = text.arrowX * parentWidth
    arrowYAtPress.current = text.arrowY * parentHeight
    textXAtPress.current = text.textX * parentWidth
    textYAtPress.current = text.textY * parentHeight
  }

  const pointX = text.arrowX * parentWidth
  const pointY = text.arrowY * parentHeight
  const textX = text.textX * parentWidth
  const textY = text.textY * parentHeight
  const rotate = Math.atan2(pointX - textX, textY - pointY) - Math.PI / 2
  const cos = Math.cos(rotate)
  const sin = Math.sin(rotate)

  const lineEndX = pointX - (headWidth - 1) * cos
  const lineEndY = pointY - (headWidth - 1) * sin
  const lineClass = 'arrow-line' + (lineHover ? ' hover' : '') + (lineDragged ? ' dragged' : '')
  // Extra 'M -1 -1' is a workaround for a chrome bug where the line dissapears if straight, even if outside the mask's clip area:
  const linePath = `M -1 -1 M ${textX} ${textY} L ${lineEndX} ${lineEndY}`

  const showLargerHead = lineHover || headHover || lineDragged || headDragged

  const headGrabber = drawHead(pointX, pointY, headGrabberWidth, headGrabberHeight, rotate, headGrabberOffset, cos, sin)
  const head = showLargerHead
    ? drawHead(pointX, pointY, headHoverWidth, headHoverHeight, rotate, headHoverOffset, cos, sin)
    : drawHead(pointX, pointY, headWidth, headHeight, rotate, 0, 0, 0)

  const editorState = editorStateRef.current
  const hasText = editorState.getCurrentContent().hasText()
  const textVisible = hasText || text.editable
  const rootClass = 'text-annotation' + (hasText ? '' : ' no-text') + (text.editable ? ' editable' : '')

  const lineMaskId = `lineMask${text.id}`
  const lineMask = textVisible ? 'url(#' + lineMaskId + ')' : ''

  const lineGrabberClass = 'arrow-line-grabber' + (lineDragged ? ' dragged' : '')
  const headGrabberClass = 'arrow-head-grabber' + (headDragged ? ' dragged' : '')

  return (
    <div className={rootClass} ref={rootRef} onDoubleClick={onDoubleClick}>
      <svg className="measurement-svg">
        <defs>
          <mask id={lineMaskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect fill="black" ref={maskRectRef} />
          </mask>
        </defs>
        <line
          className={lineGrabberClass}
          x1={lineEndX}
          y1={lineEndY}
          x2={textX}
          y2={textY}
          ref={lineGrabberRef}
          onMouseDown={onLineMouseDown}
          onMouseEnter={onLineMouseEnter}
          onMouseLeave={onLineMouseLeave}
        />
        <path
          className={headGrabberClass}
          d={headGrabber.path}
          transform={headGrabber.transform}
          ref={headGrabberRef}
          onMouseDown={onHeadMouseDown}
          onMouseEnter={onHeadMouseEnter}
          onMouseLeave={onHeadMouseLeave}
        />
        <path className="arrow-head" d={head.path} transform={head.transform} ref={headRef} />
        <path className={lineClass} d={linePath} ref={lineRef} mask={lineMask} />
      </svg>
      <TextAnchor x={textX} y={textY} onDeleteButtonClick={_onDeleteButtonClick}>
        <div className="text" ref={textRef} onMouseDown={onTextMouseDown}>
          <Editor
            editorState={editorState}
            readOnly={!text.editable}
            onChange={onTextChange}
            onBlur={finishEdit}
            ref={editorRef}
          />
        </div>
      </TextAnchor>
    </div>
  )
}

export default TextAnnotation
