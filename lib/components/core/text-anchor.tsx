import type React from 'react'
import { type FC, type ReactNode, useEffect, useRef, useState } from 'react'

interface Props {
  onDeleteButtonClick: () => void
  x: number
  y: number
  rotate?: number
  hideButtonWhenEnterPressed?: boolean
  children: ReactNode
}

const TextAnchor: FC<Props> = ({ onDeleteButtonClick, x, y, rotate, children, hideButtonWhenEnterPressed }) => {
  const [buttonShowing, setButtonShowing] = useState<boolean>(false)
  const [justCreated, setJustCreated] = useState<boolean>(true)
  const textBoxRef = useRef<HTMLDivElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const mounted = useRef<boolean>(false)

  const onClick = () => setButtonShowing(true)

  const onDocumentMouseDown = (e: MouseEvent) => {
    const textBox = textBoxRef.current
    if (!textBox) {
      return
    }
    if (!textBox.contains(e.target as Node)) {
      setButtonShowing(false)
    }
  }

  const onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || (hideButtonWhenEnterPressed && event.key === 'Enter' && !event.shiftKey)) {
      setButtonShowing(false)
    }
  }

  const onDeleteButtonClickInternal = (event: React.MouseEvent) => {
    if (event.button === 0) {
      event.preventDefault()
      event.stopPropagation()
      onDeleteButtonClick()
    }
  }

  useEffect(() => {
    mounted.current = true
    textBoxRef.current?.addEventListener('click', onClick)
    document.addEventListener('mousedown', onDocumentMouseDown)
    document.addEventListener('keydown', onDocumentKeyDown)

    setTimeout(() => {
      if (mounted.current) {
        setJustCreated(false)
      }
    }, 200)

    return () => {
      mounted.current = false
      textBoxRef.current?.removeEventListener('click', onClick)
      document.removeEventListener('mousedown', onDocumentMouseDown)
      document.removeEventListener('keydown', onDocumentKeyDown)
    }
  }, [])

  return (
    <div
      className={`text-anchor ${buttonShowing ? 'button-showing' : ''} ${justCreated ? 'just-created' : ''}`}
      style={{
        left: x,
        top: y,
        transform: rotate ? `rotate(${rotate} rad)` : undefined,
      }}
    >
      <div className="text-box" ref={textBoxRef}>
        {children}
        <button
          type="button"
          className="delete-button"
          onClick={event => onDeleteButtonClickInternal(event)}
          // Additional mouse-down handler means delete works cleanly if text is being edited:
          onMouseDown={event => onDeleteButtonClickInternal(event)}
          ref={deleteButtonRef}
        >
          <svg className="delete-button-svg">
            <path className="delete-button-icon" d="M 4 4 L 11 11 M 11 4 L 4 11" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default TextAnchor
