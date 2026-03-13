import React, { useRef, useState } from 'react'
import { Upload, X, FileText, Image as ImageIcon, Film, Mic, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileUploadProps {
    onFilesSelect: (files: File[]) => void
    accept?: string
    label?: string
    description?: string
    type?: 'image' | 'video' | 'audio'
    multiple?: boolean
    maxFiles?: number
}

const FileUpload: React.FC<FileUploadProps> = ({
    onFilesSelect,
    accept = "image/*",
    label = "Загрузить файлы",
    description,
    type = 'image',
    multiple = false,
    maxFiles = 5
}) => {
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        if (selectedFiles.length === 0) return

        let newFiles = multiple ? [...files, ...selectedFiles] : [selectedFiles[0]]
        if (multiple && newFiles.length > maxFiles) {
            newFiles = newFiles.slice(0, maxFiles)
        }

        setFiles(newFiles)
        onFilesSelect(newFiles)

        // Generate previews
        const newPreviews: string[] = []
        newFiles.forEach(f => {
            if (f.type.startsWith('image/')) {
                newPreviews.push(URL.createObjectURL(f))
            } else {
                newPreviews.push('') // placeholder for non-images
            }
        })
        setPreviews(newPreviews)
    }

    const removeFile = (index: number, e: React.MouseEvent) => {
        e.stopPropagation()
        const newFiles = files.filter((_, i) => i !== index)
        const newPreviews = previews.filter((_, i) => i !== index)

        // Clean up object URLs
        if (previews[index]) URL.revokeObjectURL(previews[index])

        setFiles(newFiles)
        setPreviews(newPreviews)
        onFilesSelect(newFiles)
        if (newFiles.length === 0 && fileInputRef.current) {
            fileInputRef.current.value = ''
        }
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

            <div className="space-y-3">
                <AnimatePresence>
                    {files.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {files.map((file, idx) => (
                                <motion.div
                                    key={`${file.name}-${idx}`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative aspect-square rounded-xl overflow-hidden border border-accent-primary/20 bg-bg-card flex items-center justify-center group"
                                >
                                    {previews[idx] ? (
                                        <img src={previews[idx]} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-accent-primary p-2 overflow-hidden">
                                            <FileText size={20} />
                                            <span className="text-[8px] truncate max-w-full">{file.name}</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => removeFile(idx, e)}
                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </motion.div>
                            ))}
                            {multiple && files.length < maxFiles && (
                                <motion.div
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-xl border-2 border-dashed border-accent-primary/20 flex flex-col items-center justify-center bg-accent-primary/5 cursor-pointer hover:border-accent-primary/40 transition-colors"
                                >
                                    <Plus size={24} className="text-accent-primary" />
                                    <span className="text-[10px] text-txt-muted mt-1">Добавить</span>
                                </motion.div>
                            )}
                        </div>
                    )}
                </AnimatePresence>

                {files.length === 0 && (
                    <motion.div
                        onClick={() => fileInputRef.current?.click()}
                        whileTap={{ scale: 0.98 }}
                        className="relative min-h-[100px] rounded-2xl border-2 border-dashed border-accent-primary/20 bg-bg-card transition-colors flex flex-col items-center justify-center p-4 cursor-pointer hover:border-accent-primary/40"
                    >
                        <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center mb-1">
                            {getIcon()}
                        </div>
                        <span className="text-txt-secondary text-sm font-medium">Нажмите для загрузки</span>
                        {description && <span className="text-txt-muted text-xs">{description}</span>}
                    </motion.div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={accept}
                    multiple={multiple}
                    className="hidden"
                />
            </div>
        </div>
    )
}

export default FileUpload
