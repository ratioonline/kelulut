import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageResize from 'tiptap-extension-resize-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import {
  Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3,
  List, ListOrdered, Link as LinkIcon, Quote, Undo, Redo, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, Trash2, Edit2, Loader2
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import MediaManager from '../media/MediaManager'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useMediaStore } from '../../stores/mediaStore'
import { useAuthStore } from '../../stores/authStore'
import { processImageFile, ProcessedMedia } from '../../lib/mediaUtils'



interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, error, placeholder }: RichTextEditorProps) {
  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Media Context
  const { addOptimisticMedia } = useMediaStore()
  const { role, myUmkm } = useAuthStore()

  const handlePastedImages = async (files: File[]) => {
    setIsUploading(true)
    const toastId = toast.loading(`Mengunggah ${files.length} gambar dari clipboard...`)

    try {
      for (const file of files) {
        // 1. Process/compress image
        const processed: ProcessedMedia = await processImageFile(file, file.name, {
          maxDimension: 1200,
          quality: 0.80,
        })

        // 2. Upload to storage
        const uniqueFileName = `${Date.now()}_${processed.fileName}`
        const storagePath = `Artikel/${uniqueFileName}`

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(storagePath, processed.blob, {
            cacheControl: '31536000',
            upsert: false,
            contentType: processed.mimeType
          })

        if (uploadError) {
          console.error('Storage Upload Error:', uploadError)
          toast.error(`Gagal mengunggah ${processed.fileName}`)
          continue
        }

        // 3. Get Public URL
        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(storagePath)
        const publicUrl = publicUrlData.publicUrl

        // 4. Insert DB record
        const { data: dbData, error: dbError } = await supabase.from('media_assets').insert({
          file_name: processed.fileName,
          file_size: processed.fileSize,
          url: publicUrl,
          mime_type: processed.mimeType,
          module: 'Artikel',
          checksum: processed.checksum,
          folder: 'Artikel',
          alt_text: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
          umkm_id: role === 'umkm_user' ? (myUmkm?.id || null) : null
        }).select().single()

        if (dbError) {
          console.error('Database Insert Error:', dbError)
          toast.error(`Gagal menyimpan metadata ${processed.fileName}`)
          continue
        }

        // 5. Update UI states
        if (dbData) {
          addOptimisticMedia({
            id: dbData.id,
            fileName: dbData.file_name,
            fileSize: dbData.file_size,
            url: dbData.url,
            mimeType: dbData.mime_type,
            checksum: dbData.checksum || '',
            folder: dbData.folder,
            module: dbData.module,
            createdAt: dbData.created_at,
            altText: dbData.alt_text || '',
            umkm_id: dbData.umkm_id
          })

          // Insert into TipTap Editor
          if (editor) {
            editor.chain().focus().setImage({
              src: dbData.url,
              alt: dbData.alt_text || dbData.file_name,
            }).run()
          }
        }
      }
      toast.success('Gambar berhasil disisipkan!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Terjadi kesalahan saat mengunggah gambar', { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#2D6A4F] underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      ImageResize,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[300px] max-w-none p-4 w-full prose-img:cursor-pointer',
      },
      handlePaste: (view, event, slice) => {
        const items = event.clipboardData?.items
        if (!items) return false

        let hasImage = false
        const filesToProcess: File[] = []

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.type.indexOf('image') !== -1) {
            hasImage = true
            const blob = item.getAsFile()
            if (blob) {
              const file = new File([blob], `paste_${Date.now()}.png`, { type: blob.type })
              filesToProcess.push(file)
            }
          }
        }

        if (hasImage && filesToProcess.length > 0) {
          event.preventDefault()
          handlePastedImages(filesToProcess)
          return true
        }

        return false
      }
    },
  })

  // Sync external changes (e.g. initial load)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  const insertMedia = useCallback((mediaItems: any[]) => {
    if (!editor || mediaItems.length === 0) return

    mediaItems.forEach(item => {
      editor.chain().focus().setImage({
        src: item.url,
        alt: item.altText || item.fileName,
      }).run()
    })
  }, [editor])



  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return <div className="h-[350px] border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center text-sm text-gray-500">Loading editor...</div>
  }

  const ToolButton = ({ onClick, isActive, icon: Icon, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isActive ? 'bg-[#2D6A4F] text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
      <Icon size={16} />
    </button>
  )

  return (
    <div className="w-full relative">
      <div className={`border rounded-xl overflow-hidden bg-white flex flex-col ${error ? 'border-red-500' : 'border-gray-300'}`}>

        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex flex-wrap items-center gap-1 sm:gap-2 overflow-x-auto">
          <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Bold" />
          <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="Italic" />
          <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={UnderlineIcon} title="Underline" />

          <div className="w-px h-5 bg-gray-300 mx-1"></div>

          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="Heading 2" />
          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} icon={Heading3} title="Heading 3" />

          <div className="w-px h-5 bg-gray-300 mx-1"></div>

          <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Bullet List" />
          <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Numbered List" />
          <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} title="Quote" />

          <div className="w-px h-5 bg-gray-300 mx-1"></div>

          <ToolButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} title="Align Left" />
          <ToolButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} title="Align Center" />
          <ToolButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} icon={AlignRight} title="Align Right" />

          <div className="w-px h-5 bg-gray-300 mx-1"></div>

          <ToolButton onClick={setLink} isActive={editor.isActive('link')} icon={LinkIcon} title="Link" />

          <button
            type="button"
            onClick={() => setIsMediaManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#2D6A4F]/10 text-[#2D6A4F] hover:bg-[#2D6A4F]/20 transition-colors ml-1"
          >
            <ImageIcon size={16} />
            <span className="hidden sm:inline">Media</span>
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1 ml-auto hidden sm:block"></div>

          <div className="flex gap-1 ml-auto sm:ml-0">
            <ToolButton onClick={() => editor.chain().focus().undo().run()} isActive={false} icon={Undo} title="Undo" />
            <ToolButton onClick={() => editor.chain().focus().redo().run()} isActive={false} icon={Redo} title="Redo" />
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto max-h-[600px] min-h-[300px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Media Manager for Inserting Images */}
      {isMediaManagerOpen && (
        <MediaManager
          isOpen={isMediaManagerOpen}
          onClose={() => setIsMediaManagerOpen(false)}
          onSelect={insertMedia}
          multiple={true}
          defaultFolder="Artikel"
          moduleName="Artikel"
        />
      )}
    </div>
  )
}
