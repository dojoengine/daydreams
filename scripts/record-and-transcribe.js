#!/usr/bin/env node

const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Configuration
const recordingDuration = process.argv[2] || 5; // Default 5 seconds if not specified
const scriptDir = __dirname;
const recordScript = path.join(scriptDir, "record-audio.js");
const transcribeScript = path.join(scriptDir, "transcribe-audio.js");

console.log(`Starting audio recording for ${recordingDuration} seconds...`);

// Make scripts executable
try {
  fs.chmodSync(recordScript, "755");
  fs.chmodSync(transcribeScript, "755");
} catch (error) {
  console.warn(`Warning: Could not make scripts executable: ${error.message}`);
}

// Run the recording script
const recordProcess = spawn("node", [recordScript, recordingDuration], {
  stdio: "inherit",
});

let audioFilePath = "";

// When recording is done, transcribe the audio
recordProcess.on("close", (code) => {
  if (code !== 0) {
    console.error(`Recording process exited with code ${code}`);
    process.exit(code);
  }

  // Find the most recent audio recording in /tmp
  const tmpDir = "/tmp";
  const files = fs
    .readdirSync(tmpDir)
    .filter(
      (file) => file.startsWith("audio-recording-") && file.endsWith(".mp3")
    )
    .map((file) => ({
      name: file,
      path: path.join(tmpDir, file),
      mtime: fs.statSync(path.join(tmpDir, file)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first

  if (files.length === 0) {
    console.error("No audio recordings found");
    process.exit(1);
  }

  audioFilePath = files[0].path;
  console.log(`Using most recent recording: ${audioFilePath}`);

  // Now transcribe the audio
  console.log("\nTranscribing audio...");
  const transcribeProcess = spawn("node", [transcribeScript, audioFilePath], {
    stdio: "inherit",
    env: {
      ...process.env,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    },
  });

  transcribeProcess.on("close", (transcribeCode) => {
    if (transcribeCode !== 0) {
      console.error(`Transcription process exited with code ${transcribeCode}`);
      process.exit(transcribeCode);
    }

    console.log("\nProcess completed successfully");
  });
});

// Handle Ctrl+C to stop recording early
process.on("SIGINT", () => {
  console.log("\nStopping recording...");
  recordProcess.kill("SIGINT");
});
