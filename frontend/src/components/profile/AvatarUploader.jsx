import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { LuCamera } from 'react-icons/lu';
import Spinner from '../common/Spinner.jsx';
import { getInitials } from '../../utils/formatters.js';
import { uploadProfilePhotoApi } from '../../api/userApi.js';

/**
 * Circular avatar with a camera overlay for uploading/replacing the profile photo.
 * Uploads directly to Cloudinary via the backend and reports the updated user back up.
 */
const AvatarUploader = ({ user, onUploaded }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('profilePhoto', file);

    setUploading(true);
    try {
      const { data } = await uploadProfilePhotoApi(formData);
      onUploaded(data.user);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      e.target.value = ''; // allow re-selecting the same file
    }
  };

  return (
    <div className="relative h-24 w-24 shrink-0">
      {user?.profilePhoto?.url ? (
        <img
          src={user.profilePhoto.url}
          alt={user.name}
          className="h-24 w-24 rounded-full object-cover ring-4 ring-white"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-700 text-2xl font-bold text-white ring-4 ring-white">
          {getInitials(user?.name)}
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white shadow-card hover:bg-accent-600 disabled:opacity-70"
        aria-label="Change profile photo"
      >
        {uploading ? <Spinner size={14} /> : <LuCamera size={15} />}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AvatarUploader;
