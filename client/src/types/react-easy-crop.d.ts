declare module 'react-easy-crop' {
  import * as React from 'react';

  export interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface Point {
    x: number;
    y: number;
  }

  export type CropShape = 'rect' | 'round';

  export interface CropperProps {
    image?: string;
    crop: Point;
    zoom?: number;
    aspect?: number;
    minZoom?: number;
    maxZoom?: number;
    cropShape?: CropShape;
    showGrid?: boolean;
    restrictPosition?: boolean;
    onCropChange: (location: Point) => void;
    onZoomChange?: (zoom: number) => void;
    onCropComplete?: (croppedArea: Area, croppedAreaPixels: Area) => void;
    classes?: Partial<Record<'container' | 'media' | 'cropArea', string>>;
    style?: React.CSSProperties;
  }

  const Cropper: React.ComponentType<CropperProps>;

  export default Cropper;
}

