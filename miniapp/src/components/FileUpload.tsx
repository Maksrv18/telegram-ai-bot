import React, { useRef, useState } from 'react'
import { Upload, X, FileText, Image as ImageIcon, Film, Mic } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileUploadProps {
    onFileSelect: (file: File | null) => void
    accept?: string
    label?: string
    description?: string
    type?: 'image' | 'video' | 'audio'
}

const FileUpload: React.FC<FileUploadProps> = ({
    onFileSelect,
    accept = "image/*",
    label = "Загрузить файл",
    description,
    type = 'image'
}) => {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            onFileSelect(selectedFile)

            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onloadend = () => setPreview(reader.result as string)
                reader.readAsDataURL(selectedFile)
            } else {
                setPreview(null)
            }
        }
    }

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation()
        setFile(null)
        setPreview(null)
        onFileSelect(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const getIcon = () => {
        if (type === 'image') return <ImageIcon size={24} className="text-accent-primary" />
        if (type === 'video') return <Film size={24} className="text-accent-primary" />
        if (type === 'audio') return <Mic size={24} className="text-accent-primary" />
        return <Upload size={24} className="text-accent-primary" />
    }

    return (
        <div className="mb-6">
            <h3 className="text-txt-primary font-bold mb-2 text-sm px-1">{label}</h3>

            <motion.div
                onClick={() => fileInputRef.current?.click()}
                whileTap={{ scale: 0.98 }}
                className={`relative min-h-[100px] rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden ${file ? 'border-accent-primary bg-accent-primary/5' : 'border-accent-primary/20 bg-bg-card hover:border-accent-primary/40'
                    }`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={accept}
                    className="hidden"
                />

                <AnimatePresence mode="wait">
                    {file ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center gap-2"
                        >
                            {preview ? (
                                <img src={preview} alt="preview" className="w-full max-h-40 object-contain rounded-xl shadow-lg border border-accent-primary/20" />
                            ) : (
                                <div className="flex items-center gap-2 text-accent-primary font-medium">
                                    <FileText size={20} />
                                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                </div>
                            )}

                            <button
                                onClick={clearFile}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center mb-1">
                                {getIcon()}
                            </div>
                            <span className="text-txt-secondary text-sm font-medium">Нажмите для загрузки</span>
                            {description && <span className="text-txt-muted text-xs">{description}</span>}
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

export default FileUpload
