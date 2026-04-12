'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Slider } from 'primereact/slider';

interface ImageCropDialogProps {
  visible: boolean;
  onHide: () => void;
  /** The raw file the user picked — dialog reads it as an object URL */
  file: File | null;
  /** Aspect ratio for the crop area (1 = square, 4 = banner) */
  aspect: number;
  /** Label for the dialog header */
  title?: string;
  /** Called with the cropped image as a File when the user confirms */
  onCropComplete: (croppedFile: File) => void;
}

/**
 * Crop a canvas region from an image and return it as a File.
 */
async function cropImage(imageSrc: string, pixelCrop: Area, fileName: string): Promise<File> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas crop failed'));
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92,
    );
  });
}

export function ImageCropDialog({
  visible,
  onHide,
  file,
  aspect,
  title = 'Crop Image',
  onCropComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const imageSrc = file ? URL.createObjectURL(file) : '';

  const onCropChange = useCallback((c: { x: number; y: number }) => setCrop(c), []);
  const onZoomChange = useCallback((z: number) => setZoom(z), []);
  const onCropDone = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || !file) return;
    setSaving(true);
    try {
      const cropped = await cropImage(imageSrc, croppedAreaPixels, file.name);
      onCropComplete(cropped);
      onHide();
    } finally {
      setSaving(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    onHide();
  };

  return (
    <Dialog
      header={title}
      visible={visible && !!file}
      style={{ width: '90vw', maxWidth: '600px' }}
      onHide={handleCancel}
      modal
      footer={
        <div className="flex justify-end gap-2">
          <Button label="Cancel" outlined severity="secondary" onClick={handleCancel} />
          <Button
            label="Apply"
            icon="pi pi-check"
            loading={saving}
            onClick={handleConfirm}
          />
        </div>
      }
    >
      <div className="relative w-full" style={{ height: '400px' }}>
        {imageSrc && (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropDone}
          />
        )}
      </div>
      <div className="mt-4 px-4">
        <label className="text-xs text-text-muted uppercase tracking-wider font-medium mb-1 block">
          Zoom
        </label>
        <Slider
          value={zoom * 100}
          onChange={(e) => setZoom((e.value as number) / 100)}
          min={100}
          max={300}
          step={1}
        />
      </div>
    </Dialog>
  );
}
