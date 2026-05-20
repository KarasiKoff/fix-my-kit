export const MAX_ATTACHMENTS_PER_REQUEST = 10;
export const MAX_ATTACHMENT_BYTES = 1024 * 1024 * 1024;

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic|heif|bmp|tiff?)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|ogv)$/i;

export function isAllowedAttachmentFile(file: File): boolean {
    const t = (file.type || '').toLowerCase();
    if (t.startsWith('image/') || t.startsWith('video/')) {
        if (t.startsWith('audio/')) {
            return false;
        }
        return true;
    }
    const name = file.name.toLowerCase();
    return IMAGE_EXT.test(name) || VIDEO_EXT.test(name);
}

export function attachmentPreviewKind(file: File): 'image' | 'video' | 'other' {
    const t = (file.type || '').toLowerCase();
    if (t.startsWith('video/') || VIDEO_EXT.test(file.name)) {
        return 'video';
    }
    if (t.startsWith('image/') || IMAGE_EXT.test(file.name)) {
        return 'image';
    }
    return 'other';
}
