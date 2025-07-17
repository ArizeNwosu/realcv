import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import { useEffect, useState } from 'react'
import { ResumeSection as ResumeSectionType } from '../lib/resumeTemplate'

interface ResumeSectionProps {
  section: ResumeSectionType
  onUpdate: (id: string, content: string) => void
  onKeystroke: () => void
  onPaste: (textLength: number) => void
}

export default function ResumeSection({ 
  section, 
  onUpdate, 
  onKeystroke, 
  onPaste 
}: ResumeSectionProps) {
  const [showToolbar, setShowToolbar] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Placeholder.configure({
        placeholder: section.placeholder,
      }),
      Underline,
      TextStyle,
      BulletList.configure({
        HTMLAttributes: {
          class: 'resume-bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'resume-ordered-list',
        },
      }),
      ListItem,
    ],
    content: section.content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onUpdate(section.id, editor.getHTML())
    },
    onSelectionUpdate: ({ editor }) => {
      // Also trigger on selection changes (which happen after keystrokes)
      onUpdate(section.id, editor.getHTML())
    },
    onFocus: () => {
      setShowToolbar(true)
    },
    onBlur: () => {
      // Delay hiding toolbar to allow toolbar clicks
      setTimeout(() => setShowToolbar(false), 150)
    },
  })

  // Handle keydown and paste events
  useEffect(() => {
    if (!editor) return

    const editorElement = editor.view.dom
    
    const handleKeydown = () => {
      onKeystroke()
    }
    
    const handleInput = () => {
      // Trigger content update on any input change
      onUpdate(section.id, editor.getHTML())
    }
    
    const handlePaste = (event: ClipboardEvent) => {
      // Get the pasted text from clipboard
      const pastedText = event.clipboardData?.getData('text') || ''
      onPaste(pastedText.length)
      // Trigger content update after paste
      setTimeout(() => {
        onUpdate(section.id, editor.getHTML())
      }, 10)
    }

    editorElement.addEventListener('keydown', handleKeydown)
    editorElement.addEventListener('input', handleInput)
    editorElement.addEventListener('paste', handlePaste, true) // Use capture phase

    return () => {
      editorElement.removeEventListener('keydown', handleKeydown)
      editorElement.removeEventListener('input', handleInput)
      editorElement.removeEventListener('paste', handlePaste, true)
    }
  }, [editor, onKeystroke, onPaste, onUpdate, section.id])

  if (!editor) {
    return <div className="animate-pulse bg-gray-100 h-20 rounded"></div>
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    children, 
    title 
  }: { 
    onClick: () => void
    isActive?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
      }`}
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </button>
  )

  return (
    <div className="bg-white border border-gray-200 rounded-12 shadow-sm p-6 hover:border-gray-300 focus-within:border-blue-500 focus-within:shadow-lg transition-all duration-200 hover:shadow-md">
      <h3 className="text-base font-semibold mb-4 text-gray-800 tracking-tight">{section.title}</h3>
      <div className="border border-gray-100 rounded-8 min-h-[120px] overflow-hidden hover:border-gray-200 focus-within:border-blue-300 transition-all duration-200">
        {/* Formatting Toolbar */}
        {showToolbar && (
          <div className="flex flex-wrap gap-1 p-3 bg-gray-50 border-b border-gray-200">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold"
            >
              <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic"
            >
              <em>I</em>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Underline"
            >
              <u>U</u>
            </ToolbarButton>
            <div className="w-px h-8 bg-gray-300 mx-1"></div>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Bullet List"
            >
              •
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Numbered List"
            >
              1.
            </ToolbarButton>
            <div className="w-px h-8 bg-gray-300 mx-1"></div>
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetAllMarks().run()}
              title="Clear Formatting"
            >
              ✕
            </ToolbarButton>
          </div>
        )}
        
        <EditorContent 
          editor={editor} 
          className={"w-full max-w-full focus:outline-none prose prose-sm max-w-none editorContent"}
        />
      </div>
    </div>
  )
}