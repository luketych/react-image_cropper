import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate a sine wave audio file using ffmpeg
const generateAudio = () => {
  const outputPath = path.join(__dirname, '../public/example_audio/default.mp3');
  const duration = 3; // 3 seconds
  const freq = 440; // A4 note

  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Generate audio using ffmpeg
  const command = `ffmpeg -f lavfi -i "sine=frequency=${freq}:duration=${duration}" -c:a libmp3lame "${outputPath}"`;
  
  try {
    execSync(command);
    console.log('Generated default audio file:', outputPath);
  } catch (error) {
    console.error('Error generating audio:', error);
    if (error.stderr) {
      console.error('ffmpeg error:', error.stderr.toString());
    }
  }
};

generateAudio();
