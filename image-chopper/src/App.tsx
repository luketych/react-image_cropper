import React, { useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { ImageCropper } from './components/ImageCropper';

function App() {
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Image Chopper Demo
        </Typography>
        
        <Box>
          <Typography variant="h6" gutterBottom>
            Image Cropper
          </Typography>
          <ImageCropper
            src="https://picsum.photos/800/600"
            alt="Random image to crop"
            height={400}
            onCrop={setCroppedImage}
          />
          
          {croppedImage && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Cropped Result
              </Typography>
              <img
                src={croppedImage}
                alt="Cropped result"
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default App; 