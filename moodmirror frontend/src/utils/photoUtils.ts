import type { PhotoAttachment } from '../types';

export function determinePresentationStyle(
  fileType: string, 
  isImportant: boolean
): PhotoAttachment['presentation']['style'] {
  if (isImportant) return 'memory-pin';
  
  if (fileType.includes('png') || fileType.includes('screenshot')) {
    return 'sticky-note';
  }
  
  if (fileType.includes('gif')) {
    return 'scrapbook';
  }
  
  return 'polaroid';
}

export function determinePhotoType(fileType: string): PhotoAttachment['type'] {
  if (fileType.includes('png') || fileType.includes('screenshot')) return 'screenshot';
  if (fileType.includes('gif')) return 'meme';
  return 'photo';
}
