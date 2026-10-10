import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface FilePickerProps {
  // Which files the browser offers, e.g. "image/*" or "video/*"
  accept: string
  buttonLabel: string
  dropHint: string
  icon: ReactNode
  onPick: (file: File) => void
}

// "Choose a file" button + drop zone (laptop). Used for images and videos.
// On phones the browser also offers the camera or the gallery.
export function FilePicker({ accept, buttonLabel, dropHint, icon, onPick }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file !== undefined) {
      onPick(file)
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    // Stop the browser from opening the dropped file itself
    event.preventDefault()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={
        isDragging
          ? 'flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-surface px-6 py-16'
          : 'flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border px-6 py-16'
      }
    >
      {icon}
      <Button size="lg" onClick={() => inputRef.current?.click()}>
        {buttonLabel}
      </Button>
      <p className="hidden text-sm text-muted md:block">{dropHint}</p>

      {/* Hidden real file input, opened by the button above */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files)
          // Allow choosing the same file again
          event.target.value = ''
        }}
      />
    </div>
  )
}
