#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { ElevenLabsClient } = require("elevenlabs");

// Get the audio file path from command line argument
const audioFilePath = process.argv[2];

if (!audioFilePath) {
  console.error("Please provide an audio file path as an argument");
  console.error("Usage: node transcribe-audio.js /path/to/audio.mp3");
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(audioFilePath)) {
  console.error(`File not found: ${audioFilePath}`);
  process.exit(1);
}

// Initialize the ElevenLabs client
const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Function to transcribe audio
async function transcribeAudio(filePath) {
  try {
    console.log(`Reading file: ${filePath}`);
    const fileBuffer = fs.readFileSync(filePath);
    const fileStats = fs.statSync(filePath);

    console.log(`File size: ${fileStats.size} bytes`);

    // Determine MIME type based on file extension
    const fileExt = path.extname(filePath).toLowerCase();
    const mimeType =
      fileExt === ".mp3"
        ? "audio/mp3"
        : fileExt === ".wav"
          ? "audio/wav"
          : "audio/mpeg"; // Default fallback

    console.log(`Using MIME type: ${mimeType}`);

    // Create a Blob from the file buffer
    const fileBlob = new Blob([fileBuffer], { type: mimeType });

    console.log(`Created blob of size: ${fileBlob.size} bytes`);
    console.log("Sending to Eleven Labs for transcription...");

    // Send to Eleven Labs for transcription
    const transcription = await elevenLabsClient.speechToText.convert({
      file: fileBlob,
      model_id: "scribe_v1",
    });

    console.log("\nTranscription result:");
    console.log("-------------------");
    console.log(transcription.text);
    console.log("-------------------");

    return transcription.text;
  } catch (error) {
    console.error("Transcription error:", error);

    // If there's a response body in the error, log it
    if (error.body && error.body.detail) {
      console.error(
        "Error details:",
        JSON.stringify(error.body.detail, null, 2)
      );
    }

    throw error;
  }
}

// Main function
async function main() {
  try {
    await transcribeAudio(audioFilePath);
  } catch (error) {
    console.error("Failed to transcribe audio");
    process.exit(1);
  }
}

// Run the main function
main();
