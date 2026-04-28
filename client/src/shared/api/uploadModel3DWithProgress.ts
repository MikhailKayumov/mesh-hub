export type UploadProgressCallback = (percent: number) => void;

export interface UploadModel3DResult {
  modelId: string;
}

const UPLOAD_PATH = 'models-3d/upload';

function buildUploadUrl(): string {
  const base = (import.meta.env.VITE_APP_API_URL ?? '') as string;

  if (!base) return `/${UPLOAD_PATH}`;

  return base.endsWith('/') ? `${base}${UPLOAD_PATH}` : `${base}/${UPLOAD_PATH}`;
}

export function uploadModel3DWithProgress(
  formData: FormData,
  onProgress: UploadProgressCallback,
): Promise<UploadModel3DResult> {
  return new Promise<UploadModel3DResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', buildUploadUrl(), true);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadModel3DResult);
        } catch {
          reject(new Error('Invalid response from server'));
        }
        return;
      }

      try {
        reject(JSON.parse(xhr.responseText));
      } catch {
        reject(new Error(xhr.statusText || 'Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    xhr.send(formData);
  });
}
