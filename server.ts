import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
const publicDir = path.join(__dirname, 'public');
const croppedImagesDir = path.join(publicDir, 'cropped-images');
const croppedAudioDir = path.join(publicDir, 'cropped-audio');
const exampleImagesDir = path.join(publicDir, 'example_images');
const exampleAudioDir = path.join(publicDir, 'example_audio');

[publicDir, croppedImagesDir, croppedAudioDir, exampleImagesDir, exampleAudioDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();

// Configure CORS
app.use(cors());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Choose directory based on file type
    const isAudio = file.mimetype.startsWith('audio/');
    const uploadDir = isAudio ? croppedAudioDir : croppedImagesDir;
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const ext = file.mimetype.startsWith('audio/') ? '.mp3' : '.jpg';
    const prefix = file.mimetype.startsWith('audio/') ? 'cropped-audio-' : 'cropped-';
    const fileName = `${prefix}${timestamp}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

// Serve static files from public directory
app.use(express.static(publicDir));

// Log requests to debug path issues
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Handle file uploads (both image and audio)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { filename } = req.file;
    const isAudio = req.file.mimetype.startsWith('audio/');
    const baseDir = isAudio ? '/cropped-audio/' : '/cropped-images/';
    
    res.status(200).json({ 
      success: true,
      filePath: baseDir + filename,
      filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from: ${publicDir}`);
  console.log(`Cropped images directory: ${croppedImagesDir}`);
  console.log(`Cropped audio directory: ${croppedAudioDir}`);
});
