# Image Chopper

A lightweight React component for cropping images using react-image-crop. Supports both PNG and JPG formats.

## Installation

```bash
npm install image-chopper
# or
yarn add image-chopper
```

## Usage

```tsx
import { ImageCropper } from 'image-chopper';
import 'react-image-crop/dist/ReactCrop.css';

function App() {
  const handleCropComplete = (blob: Blob, dataUrl: string) => {
    // Use the cropped image blob or data URL
    console.log('Cropped image blob:', blob);
    console.log('Cropped image data URL:', dataUrl);
  };

  return (
    <ImageCropper
      src="path/to/your/image.jpg"
      aspect={16/9} // Optional aspect ratio constraint
      minWidth={100} // Optional minimum width in pixels
      minHeight={100} // Optional minimum height in pixels
      onCropComplete={handleCropComplete}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| src | string | Yes | - | The source URL of the image to crop |
| aspect | number | No | undefined | Aspect ratio of the crop (width/height) |
| minWidth | number | No | 100 | Minimum width of the crop in pixels |
| minHeight | number | No | 100 | Minimum height of the crop in pixels |
| onCropComplete | (blob: Blob, dataUrl: string) => void | No | undefined | Callback function when crop is complete |

## Features

- Simple, easy-to-use interface
- Supports aspect ratio constraints
- Returns both Blob and base64 data URL formats
- Built with TypeScript for type safety
- Supports PNG and JPG formats
- Fully responsive
- No additional dependencies besides react-image-crop

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## License

MIT
