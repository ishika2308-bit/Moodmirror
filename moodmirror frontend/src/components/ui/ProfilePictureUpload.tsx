import React, { useRef, useState } from 'react';
import { Camera, User, Loader2 } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../../lib/firebase';

interface ProfilePictureUploadProps {
  currentPhotoUrl: string | null;
  onPhotoUploaded: (url: string) => void;
  size?: 'md' | 'lg' | 'xl';
}

export function ProfilePictureUpload({ currentPhotoUrl, onPhotoUploaded, size = 'xl' }: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClass = {
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  }[size];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    try {
      setUploading(true);
      const storage = getStorage();
      const fileRef = ref(storage, `users/${auth.currentUser.uid}/profile_${Date.now()}`);
      
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      onPhotoUploaded(url);
    } catch (err) {
      console.error("Profile picture upload failed", err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block group">
      <div 
        className={`${sizeClass} rounded-full border-2 border-[var(--c-border)] shadow-xl overflow-hidden flex items-center justify-center bg-[var(--c-card)] cursor-pointer transition-transform hover:scale-105`}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 size={32} className="animate-spin text-[var(--c-text)] opacity-50" />
        ) : currentPhotoUrl ? (
          <img src={currentPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <User size={size === 'xl' ? 64 : 32} className="text-[var(--c-subtext)] opacity-50" />
        )}
      </div>
      
      <div 
        className="absolute bottom-0 right-0 p-3 rounded-full bg-[var(--c-text)] text-[var(--c-bg)] shadow-lg cursor-pointer transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform"
        onClick={() => fileInputRef.current?.click()}
      >
        <Camera size={size === 'xl' ? 24 : 16} />
      </div>

      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
    </div>
  );
}
