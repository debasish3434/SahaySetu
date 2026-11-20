import { useRef } from 'react';
import toast from 'react-hot-toast';
import { LuUpload, LuX, LuImage } from 'react-icons/lu';

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;

/**
 * Multi-file photo picker with client-side previews.
 * Validates file type/size/count before handing files up to the parent form.
 */
const PhotoUpload = ({ files, onChange }) => {
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    const incoming = Array.from(fileList);
    const combined = [...files];

    for (const file of incoming) {
      if (combined.length >= MAX_FILES) {
        toast.error(`You can upload up to ${MAX_FILES} photos`);
        break;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds the 5MB limit`);
        continue;
      }
      combined.push(file);
    }
    onChange(combined);
  };

  const removeFile = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="form-label">Disaster Photos (optional, up to {MAX_FILES})</label>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink-300 bg-ink-100/40 px-4 py-8 text-center transition-colors hover:border-brand-500 hover:bg-brand-50"
      >
        <LuUpload className="text-brand-600" size={22} />
        <p className="text-sm font-medium text-ink-700">Click to upload or drag and drop</p>
        <p className="text-xs text-ink-500">PNG, JPG or WEBP — up to 5MB each</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-ink-100">
              <img
                src={URL.createObjectURL(file)}
                alt={`Upload preview ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove photo"
              >
                <LuX size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
          <LuImage size={14} /> No photos added yet
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
