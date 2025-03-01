#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Configuration
const outputDir = "/tmp";
const outputFile = path.join(outputDir, `audio-recording-${Date.now()}.mp3`);
const recordingDuration = process.argv[2] || 10; // Default 10 seconds if not specified

console.log(
  `Recording audio for ${recordingDuration} seconds to ${outputFile}...`
);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Use FFmpeg to record audio directly to MP3
// This uses the default input device and creates a properly formatted MP3 file
const ffmpeg = spawn("ffmpeg", [
  "-f",
  "avfoundation", // Use AVFoundation on macOS (use 'alsa' on Linux)
  "-i",
  ":0", // Use default audio input device
  "-t",
  recordingDuration.toString(), // Duration in seconds
  "-acodec",
  "libmp3lame", // Use MP3 codec
  "-ab",
  "128k", // 128kbps bitrate
  "-ac",
  "1", // Mono audio
  "-ar",
  "44100", // 44.1kHz sample rate
  "-y", // Overwrite output file if it exists
  outputFile,
]);

ffmpeg.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

ffmpeg.stderr.on("data", (data) => {
  // FFmpeg outputs progress information to stderr
  process.stderr.write(data);
});

ffmpeg.on("close", (code) => {
  if (code === 0) {
    console.log(`\nRecording completed successfully!`);
    console.log(`Audio saved to: ${outputFile}`);

    // Print file stats
    const stats = fs.statSync(outputFile);
    console.log(`File size: ${stats.size} bytes`);

    // Output the file path so it can be used by other scripts
    console.log(`OUTPUT_FILE=${outputFile}`);
  } else {
    console.error(`\nRecording process exited with code ${code}`);
  }
});

// Handle Ctrl+C to stop recording early
process.on("SIGINT", () => {
  console.log("\nStopping recording...");
  ffmpeg.kill("SIGTERM");
});
