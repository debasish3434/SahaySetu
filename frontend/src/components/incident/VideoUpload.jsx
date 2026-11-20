import { useRef } from 'react';
import toast from 'react-hot-toast';
import { LuVideo, LuX, LuFilm } from 'react-icons/lu';

const MAX_FILES = 2;
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Multi-file video picker with client-side previews using HTML5 <video>.
 * Validates file type, size, and count before sending to parent form.
 */
const VideoUpload = ({ files = [], onChange }) => {
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    const incoming = Array.from(fileList);
    const combined = [...files];

    for (const file of incoming) {
      if (combined.length >= MAX_FILES) {
        toast.error(`You can upload up to ${MAX_FILES} videos`);
        break;
      }
      if (!file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a valid video file`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds the 25MB limit`);
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
      <label className="form-label">Disaster Video Evidence (optional, up to {MAX_FILES})</label>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink-300 bg-ink-100/40 px-4 py-8 text-center transition-colors hover:border-brand-500 hover:bg-brand-50"
      >
        <LuVideo className="text-brand-600" size={22} />
        <p className="text-sm font-medium text-ink-700">Click to upload video or drag and drop</p>
        <p className="text-xs text-ink-500">MP4, MOV, or WEBM — up to 25MB each (max 60 seconds)</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="group relative aspect-video overflow-hidden rounded-lg border border-ink-100 bg-black">
              <video
                src={URL.createObjectURL(file)}
                controls
                className="h-full w-full object-contain"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-opacity hover:bg-danger-600"
                aria-label="Remove video"
              >
                <LuX size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
          <LuFilm size={14} /> No video files added yet
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
