import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void;
  currentImageUrl?: string;
  maxSizeMB?: number;
}

export function ImageUpload({ onImageSelect, currentImageUrl, maxSizeMB = 5 }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`Image must be smaller than ${maxSizeMB}MB`);
      return;
    }

    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Pass file to parent (ready for Cloudinary upload)
    onImageSelect(file);
  }, [onImageSelect, maxSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setError('');
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      {!preview ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-300
            ${isDragging 
              ? 'border-[#28f5cc] bg-[#28f5cc]/10 scale-105' 
              : 'border-[#747c88]/30 hover:border-[#28f5cc]/50 hover:bg-[#28f5cc]/5'
            }
          `}
          style={{
            boxShadow: isDragging 
              ? '0 0 20px rgba(40, 245, 204, 0.3)' 
              : 'none'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#2a3444]/50 flex items-center justify-center border-2 border-[#747c88]/30">
              <Upload className="w-8 h-8 text-[#747c88]" />
            </div>
            <div>
              <p className="text-white font-medium mb-1">
                {isDragging ? 'Drop your image here' : 'Drag & drop your avatar'}
              </p>
              <p className="text-[#747c88] text-sm">
                or <span className="text-[#28f5cc] font-semibold">click to browse</span>
              </p>
              <p className="text-[#747c88] text-xs mt-1">
                PNG, JPG up to {maxSizeMB}MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Preview */}
          <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-[#28f5cc] ring-2 ring-[#28f5cc]/50" style={{ boxShadow: '0 0 20px rgba(40, 245, 204, 0.4)' }}>
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Remove/Replace Button */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleClick}
              className="px-4 py-2 rounded-full bg-[#2a3444]/50 border border-[#747c88]/30 text-white hover:border-[#28f5cc] hover:bg-[#28f5cc]/10 transition-all text-sm"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Replace
              </div>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 rounded-full bg-[#2a3444]/50 border border-red-500/30 text-red-400 hover:border-red-500 hover:bg-red-500/10 transition-all text-sm"
            >
              <div className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Remove
              </div>
            </button>
          </div>

          {/* Hidden file input for replace */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}

