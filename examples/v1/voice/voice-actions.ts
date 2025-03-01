import { z } from "zod";
import {
  input,
  extension,
  service,
  context,
  formatMsg,
} from "@daydreamsai/core";
import type { WorkingMemory } from "@daydreamsai/core";
import { ElevenLabsClient } from "elevenlabs";
// Conditionally import node-record-lpcm16 for Node.js environments
let recorder: any = null;
try {
  // This will only succeed in Node.js environments
  if (typeof window === "undefined") {
    // Dynamic import to avoid browser issues
    recorder = require("node-record-lpcm16");
  }
} catch (error) {
  console.log(
    "Node.js recording module not available, browser-only mode enabled"
  );
}

// Initialize the ElevenLabs client
// Note: Make sure to install the elevenlabs package if not already installed
// npm install elevenlabs
const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

/**
 * Cross-platform base64 decode function (works in both browser and Node.js)
 */
function decodeBase64(base64String: string): Uint8Array {
  // In browser environments, use atob
  if (typeof window !== "undefined" && typeof atob !== "undefined") {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  // In Node.js environments, use Buffer
  else {
    const buffer = Buffer.from(base64String, "base64");
    return new Uint8Array(buffer);
  }
}

/**
 * Helper function to convert a Blob to base64 string
 * Works in both browser and Node.js environments
 */
async function blobToBase64(blob: Blob): Promise<string> {
  // In browser environments, use FileReader
  if (typeof window !== "undefined" && typeof FileReader !== "undefined") {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(",")[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  // In Node.js environments, convert using Buffer
  else {
    // Convert Blob to Buffer
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Convert Buffer to base64
    return buffer.toString("base64");
  }
}

/**
 * Helper function to store transcription in working memory
 */
function storeTranscriptionInMemory(ctx: any, transcription: string) {
  // Store transcription in working memory
  (
    ctx.workingMemory as WorkingMemory & {
      currentTranscription?: string;
      transcriptionHistory?: string[];
    }
  ).currentTranscription = transcription;

  // Add to transcription history if it exists
  const workingMemory = ctx.workingMemory as WorkingMemory & {
    transcriptionHistory?: string[];
  };

  if (!workingMemory.transcriptionHistory) {
    workingMemory.transcriptionHistory = [];
  }

  workingMemory.transcriptionHistory.push(transcription);

  // Update context memory if available
  if (
    ctx.agentMemory &&
    ctx.agentMemory.lastTranscriptionTimestamp !== undefined
  ) {
    ctx.agentMemory.lastTranscriptionTimestamp = Date.now();
    ctx.agentMemory.observations = ctx.agentMemory.observations || [];
    ctx.agentMemory.observations.push(
      `Voice transcription completed at ${new Date().toLocaleTimeString()}`
    );
  }
}

/**
 * Audio Recorder Service
 * This service handles both browser-based and Node.js audio recording
 */
class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private recordingInterval: NodeJS.Timer | null = null;
  private onAudioAvailable: ((audioBlob: Blob) => void) | null = null;
  private nodeRecorder: any = null;
  private isNodeEnvironment: boolean = false;
  private nodeAudioChunks: (Buffer | string)[] = [];
  private nodeRecordingSupported: boolean = false;

  constructor() {
    // Determine environment
    this.isNodeEnvironment = typeof window === "undefined";
    this.nodeRecordingSupported = this.isNodeEnvironment && recorder !== null;
  }

  async initialize() {
    // This method will be called when the service is booted
    console.log("Audio Recorder Service initialized");
    if (this.isNodeEnvironment) {
      console.log(
        `Node.js environment detected, recording ${this.nodeRecordingSupported ? "supported" : "NOT supported"}`
      );

      if (this.nodeRecordingSupported) {
        // Check for available recording programs
        await this.checkRecordingDependencies();
      } else {
        console.warn(
          "Node.js recording requires the node-record-lpcm16 package and SoX to be installed"
        );
        console.warn(
          "Install SoX: brew install sox (macOS) or apt-get install sox (Linux)"
        );
      }
    } else {
      console.log("Browser environment detected");
    }
  }

  /**
   * Check for available recording programs and log which ones are available
   */
  private async checkRecordingDependencies(): Promise<void> {
    if (!this.isNodeEnvironment) return;

    const availablePrograms: string[] = [];
    const { execSync } = require("child_process");

    // Check for SoX
    try {
      execSync("sox --version", { stdio: "ignore" });
      availablePrograms.push("sox/rec");
    } catch (e) {
      console.warn("SoX not found. This is the recommended recording program.");
    }

    // Check for arecord
    try {
      execSync("arecord --version", { stdio: "ignore" });
      availablePrograms.push("arecord");
    } catch (e) {
      // Not available
    }

    // Check for ffmpeg
    try {
      execSync("ffmpeg -version", { stdio: "ignore" });
      availablePrograms.push("ffmpeg");
    } catch (e) {
      // Not available
    }

    if (availablePrograms.length > 0) {
      console.log(
        `Available recording programs: ${availablePrograms.join(", ")}`
      );
    } else {
      console.warn(
        "No recording programs found. Please install SoX for best results:"
      );
      console.warn("  - macOS: brew install sox");
      console.warn("  - Linux: apt-get install sox or yum install sox");
      console.warn(
        "  - Windows: Download from https://sourceforge.net/projects/sox/"
      );
    }
  }

  async startRecording(onAudioAvailable: (audioBlob: Blob) => void) {
    if (this.isRecording) {
      console.log("Already recording");
      return false;
    }

    this.onAudioAvailable = onAudioAvailable;

    if (this.isNodeEnvironment) {
      if (!this.nodeRecordingSupported) {
        console.error("Node.js recording is not supported in this environment");
        return false;
      }
      return this.startNodeRecording();
    } else {
      return this.startBrowserRecording();
    }
  }

  private async startBrowserRecording(): Promise<boolean> {
    try {
      // Check if we're in a browser environment
      if (typeof window === "undefined" || !navigator.mediaDevices) {
        throw new Error(
          "Browser audio recording is only available in browser environments"
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try to use MP3 format if supported by the browser
      const mimeType = MediaRecorder.isTypeSupported("audio/mp3")
        ? "audio/mp3"
        : MediaRecorder.isTypeSupported("audio/mpeg")
          ? "audio/mpeg"
          : "audio/webm";

      console.log(`Using browser recording MIME type: ${mimeType}`);

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000, // 128 kbps for good quality
      });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.audioChunks = [];

        if (this.onAudioAvailable) {
          this.onAudioAvailable(audioBlob);
        }
      };

      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;

      // Set up interval to stop and restart recording every 5 seconds
      // This creates manageable audio chunks for processing
      this.recordingInterval = setInterval(() => {
        if (this.mediaRecorder && this.isRecording) {
          this.mediaRecorder.stop();

          // Start a new recording session after a short delay
          setTimeout(() => {
            if (this.isRecording && this.mediaRecorder) {
              this.mediaRecorder.start();
            }
          }, 500);
        }
      }, 5000); // Record in 5-second chunks

      console.log("Started recording audio in browser");
      return true;
    } catch (error) {
      console.error("Error starting browser audio recording:", error);
      return false;
    }
  }

  private startNodeRecording(): boolean {
    try {
      if (!recorder) {
        throw new Error("Node recording module not available");
      }

      this.nodeAudioChunks = [];

      // First, check if SoX is installed by trying to execute a simple command
      const { execSync } = require("child_process");
      try {
        execSync("sox --version", { stdio: "ignore" });
      } catch (soxError: any) {
        console.error("SoX is not installed or not found in PATH");
        console.error("Please install SoX:");
        console.error("  - macOS: brew install sox");
        console.error("  - Linux: apt-get install sox or yum install sox");
        console.error(
          "  - Windows: Download from https://sourceforge.net/projects/sox/"
        );

        // Try alternative recording programs if available
        let alternativeFound = false;

        // Try arecord (common on Linux)
        try {
          execSync("arecord --version", { stdio: "ignore" });
          this.nodeRecorder = recorder.record({
            sampleRate: 16000,
            channels: 1,
            audioType: "wav",
            threshold: 0.5,
            recordProgram: "arecord",
            silence: "0.5",
            verbose: true,
          });
          console.log("Using alternative recording program: arecord");
          alternativeFound = true;
        } catch (arecordError) {
          console.log("arecord not available, trying next alternative...");
        }

        // Try ffmpeg if arecord failed
        if (!alternativeFound) {
          try {
            execSync("ffmpeg -version", { stdio: "ignore" });
            this.nodeRecorder = recorder.record({
              sampleRate: 16000,
              channels: 1,
              audioType: "wav",
              threshold: 0.5,
              recordProgram: "ffmpeg",
              silence: "0.5",
              verbose: true,
            });
            console.log("Using alternative recording program: ffmpeg");
            alternativeFound = true;
          } catch (ffmpegError) {
            console.log("ffmpeg not available");
          }
        }

        // If no alternatives worked, throw the original error
        if (!alternativeFound) {
          throw new Error(
            "No suitable audio recording program found. Please install SoX: " +
              soxError.message
          );
        }
      }

      // If we haven't set up the recorder yet (no error with SoX), configure it now
      if (!this.nodeRecorder) {
        // Configure the recorder with SoX
        this.nodeRecorder = recorder.record({
          sampleRate: 16000,
          channels: 1,
          audioType: "mp3",
          threshold: 0.5,
          recordProgram: "rec",
          silence: "0.5",
          verbose: true,
          file: "/tmp/audio-recording.mp3",
          options: [
            "-t",
            "mp3",
            "-C",
            "128",
            "--endian",
            "little",
            "--channels",
            "1",
            "--rate",
            "16000",
            "--encoding",
            "signed-integer",
          ],
          encodingConfig: {
            encoding: "MP3",
            sampleRateHertz: 16000,
            languageCode: "en-US",
          },
        });
        console.log("Using SoX for audio recording with MP3 file output");
      }

      // Start recording
      const stream = this.nodeRecorder
        .stream()
        .on("data", (chunk: any) => {
          // Handle both Buffer and string data types
          if (chunk) {
            // If we're using file output mode, chunk might be the file path
            if (typeof chunk === "string" && chunk.indexOf(".mp3") !== -1) {
              console.log(`Received file path: ${chunk}`);
              // Just store the file path, we'll read it when processing
              this.nodeAudioChunks = [chunk];
              // Process immediately when we get a file
              this.processNodeAudioChunks();
            } else {
              // Convert string to Buffer if needed
              const bufferChunk = Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk);
              this.nodeAudioChunks.push(bufferChunk);

              // Process chunks every 5 seconds
              if (
                this.nodeAudioChunks.length > 0 &&
                this.nodeAudioChunks.length % 10 === 0
              ) {
                this.processNodeAudioChunks();
              }
            }
          }
        })
        .on("error", (err: Error) => {
          console.error("Error in Node.js recording stream:", err);
          // If we get a stream error, stop recording to prevent further issues
          this.stopRecording();
        })
        .on("close", () => {
          console.log("Node.js recording stream closed");
        })
        .on("end", () => {
          console.log("Node.js recording stream ended");
          // Process any remaining chunks
          if (this.nodeAudioChunks.length > 0) {
            this.processNodeAudioChunks();
          }
        });

      this.isRecording = true;

      // Set up interval to process audio chunks every 5 seconds
      this.recordingInterval = setInterval(() => {
        if (this.isRecording && this.nodeAudioChunks.length > 0) {
          this.processNodeAudioChunks();
        }
      }, 5000);

      console.log("Started recording audio in Node.js");
      return true;
    } catch (error: any) {
      console.error("Error starting Node.js audio recording:", error);

      // Provide helpful error message based on error type
      if (error.message && error.message.includes("ENOENT")) {
        console.error(
          "Could not find the required audio recording executable."
        );
        console.error(
          "Please make sure SoX is installed and available in your PATH."
        );
        console.error("You can install it with:");
        console.error("  - macOS: brew install sox");
        console.error("  - Linux: apt-get install sox");
        console.error(
          "  - Windows: Download from https://sourceforge.net/projects/sox/"
        );
      }

      return false;
    }
  }

  private processNodeAudioChunks() {
    if (this.nodeAudioChunks.length === 0) return;

    try {
      // Log the type of the first chunk for debugging
      const firstChunk = this.nodeAudioChunks[0];
      console.log(
        `Processing ${this.nodeAudioChunks.length} audio chunks. First chunk type: ${typeof firstChunk}, is Buffer: ${Buffer.isBuffer(firstChunk)}`
      );

      // Handle different data formats
      let audioData: Buffer | null = null;

      // Check if we have a file path (when using file output mode)
      if (this.nodeAudioChunks.length === 1 && typeof firstChunk === "string") {
        const filePath = firstChunk as string;
        if (
          filePath.indexOf(".mp3") !== -1 ||
          filePath.indexOf(".wav") !== -1
        ) {
          try {
            console.log(
              `Detected file path: ${filePath}, attempting to read file`
            );
            const fs = require("fs");
            if (fs.existsSync(filePath)) {
              const fileData = fs.readFileSync(filePath);
              audioData = fileData;
              console.log(
                `Successfully read audio file of size: ${fileData.length} bytes`
              );

              // For MP3 files, we don't need to check for RIFF header
              const isMP3 = filePath.indexOf(".mp3") !== -1;
              if (!isMP3 && fileData.length > 44) {
                const headerStr = fileData.slice(0, 4).toString();
                if (headerStr !== "RIFF") {
                  console.warn(
                    "WAV file doesn't have a valid RIFF header, may not be a proper WAV file"
                  );
                } else {
                  console.log("Valid WAV file with RIFF header detected");
                }
              } else if (isMP3) {
                console.log("MP3 file detected");
              }
            } else {
              console.warn(`File not found: ${filePath}`);
            }
          } catch (fileError) {
            console.error("Error reading audio file:", fileError);
          }
        }
      }

      // If we haven't processed the data yet, process all chunks
      if (!audioData) {
        // Ensure all chunks are Buffer objects
        const bufferChunks = this.nodeAudioChunks.map((chunk) => {
          if (Buffer.isBuffer(chunk)) return chunk;

          // Try different encodings if it's a string
          if (typeof chunk === "string") {
            const chunkStr = chunk as string;
            // If it looks like a WAV header, use binary encoding
            if (chunkStr.startsWith("RIFF")) {
              return Buffer.from(chunkStr, "binary");
            }
            // Default to UTF-8
            return Buffer.from(chunkStr);
          }

          // For any other type, try to convert to buffer
          return Buffer.from(String(chunk));
        });

        // Combine all chunks into a single buffer
        audioData = Buffer.concat(bufferChunks);
      }

      // Clear the chunks array to free memory
      this.nodeAudioChunks = [];

      if (!audioData || audioData.length === 0) {
        console.warn("No valid audio data to process");
        return;
      }

      // For MP3 files, we don't need to check for RIFF header
      const isMP3 =
        (audioData.length > 2 &&
          audioData[0] === 0x49 &&
          audioData[1] === 0x44 &&
          audioData[2] === 0x33) || // ID3v2 tag
        (audioData[0] === 0xff && (audioData[1] & 0xe0) === 0xe0); // MPEG sync word

      const isWAV =
        audioData.length > 4 && audioData.slice(0, 4).toString() === "RIFF";

      // If the data is neither MP3 nor WAV, treat it as raw PCM data
      if (!isMP3 && !isWAV) {
        console.log(
          "Audio data appears to be raw PCM, converting to WAV format"
        );

        // Create a proper WAV header for the raw PCM data
        // Standard WAV header for 16-bit PCM, mono, 16000 Hz
        const sampleRate = 16000;
        const numChannels = 1;
        const bitsPerSample = 16;

        // Calculate sizes
        const dataSize = audioData.length;
        const blockAlign = numChannels * (bitsPerSample / 8);
        const byteRate = sampleRate * blockAlign;
        const headerSize = 44; // Standard WAV header size
        const totalSize = headerSize + dataSize;

        // Create WAV header buffer
        const header = Buffer.alloc(headerSize);

        // RIFF chunk descriptor
        header.write("RIFF", 0);
        header.writeUInt32LE(totalSize - 8, 4); // File size - 8
        header.write("WAVE", 8);

        // "fmt " sub-chunk
        header.write("fmt ", 12);
        header.writeUInt32LE(16, 16); // fmt chunk size (16 for PCM)
        header.writeUInt16LE(1, 20); // Audio format (1 for PCM)
        header.writeUInt16LE(numChannels, 22); // Number of channels
        header.writeUInt32LE(sampleRate, 24); // Sample rate
        header.writeUInt32LE(byteRate, 28); // Byte rate
        header.writeUInt16LE(blockAlign, 32); // Block align
        header.writeUInt16LE(bitsPerSample, 34); // Bits per sample

        // "data" sub-chunk
        header.write("data", 36);
        header.writeUInt32LE(dataSize, 40); // Data chunk size

        // Combine header and audio data
        const wavBuffer = Buffer.concat([header, audioData]);

        // Create a blob with WAV MIME type
        const arrayBuffer = new Uint8Array(wavBuffer).buffer;
        const audioBlob = new Blob([arrayBuffer], { type: "audio/wav" });

        console.log(
          `Created WAV audio blob of size: ${audioBlob.size} bytes, type: audio/wav`
        );

        if (this.onAudioAvailable) {
          this.onAudioAvailable(audioBlob);
        }
        return;
      }

      // Convert buffer to blob for consistent API
      const arrayBuffer = new Uint8Array(audioData).buffer;
      const audioType = isMP3 ? "audio/mp3" : "audio/wav";
      const audioBlob = new Blob([arrayBuffer], { type: audioType });

      console.log(
        `Created audio blob of size: ${audioBlob.size} bytes, type: ${audioType}`
      );

      if (this.onAudioAvailable) {
        this.onAudioAvailable(audioBlob);
      }
    } catch (error) {
      console.error("Error processing Node.js audio chunks:", error);
      // Clear the chunks to prevent repeated errors
      this.nodeAudioChunks = [];
    }
  }

  stopRecording() {
    if (!this.isRecording) {
      return;
    }

    // Clear the recording interval
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    if (this.isNodeEnvironment && this.nodeRecordingSupported) {
      // Stop Node.js recording
      if (this.nodeRecorder) {
        try {
          this.nodeRecorder.stop();

          // Process any remaining audio chunks
          if (this.nodeAudioChunks.length > 0) {
            this.processNodeAudioChunks();
          }
        } catch (error) {
          console.error("Error stopping Node.js recording:", error);
        } finally {
          this.nodeRecorder = null;
        }
      }
    } else {
      // Stop browser recording
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        try {
          this.mediaRecorder.stop();

          // Stop all tracks in the stream
          if (this.mediaRecorder.stream) {
            this.mediaRecorder.stream
              .getTracks()
              .forEach((track) => track.stop());
          }
        } catch (error) {
          console.error("Error stopping browser recording:", error);
        } finally {
          this.mediaRecorder = null;
        }
      }
    }

    this.isRecording = false;
    console.log(
      `Stopped recording audio in ${this.isNodeEnvironment ? "Node.js" : "Browser"}`
    );
  }

  isActive() {
    return this.isRecording;
  }
}

// Define a voice context
const voiceContext = context({
  type: "voice:input",
  key: () => "default",
  schema: z.object({}),
});

// Voice service setup
const voiceService = service({
  register(container) {
    container.singleton("audioRecorder", () => new AudioRecorderService());
  },
  async boot(container) {
    const audioRecorder =
      container.resolve<AudioRecorderService>("audioRecorder");
    await audioRecorder.initialize();
    console.log("Audio recorder service initialized");
  },
});

// Create the voice extension
export const voice = extension({
  name: "voice",
  services: [voiceService],
  contexts: {
    voiceInput: voiceContext,
  },
  inputs: {
    "voice:audio": input({
      schema: z.object({
        audioData: z.string().describe("Base64-encoded audio data"),
        audioType: z.string().default("audio/mp3"),
      }),
      format: ({ audioType }) =>
        formatMsg({
          role: "user",
          user: "system",
          content: `Audio input received (${audioType})`,
        }),
      async subscribe(send, { container }) {
        const audioRecorder =
          container.resolve<AudioRecorderService>("audioRecorder");

        // Function to handle audio when it becomes available
        const handleAudio = async (audioBlob: Blob) => {
          try {
            // Log audio blob details for debugging
            console.log(
              `Processing audio blob: size=${audioBlob.size} bytes, type=${audioBlob.type}`
            );

            // Validate the audio blob
            if (audioBlob.size === 0) {
              console.warn("Received empty audio blob, skipping processing");
              return;
            }

            // Ensure we have a valid audio type
            let audioType = audioBlob.type;
            if (!audioType || audioType === "application/octet-stream") {
              // If no type or generic binary type, assume MP3
              audioType = "audio/mp3";
              console.log(
                `No specific audio type detected, using ${audioType}`
              );
            }

            // Convert blob to base64
            const base64data = await blobToBase64(audioBlob);
            console.log(
              `Converted to base64 string of length: ${base64data.length}`
            );

            // Send the audio data for transcription
            console.log(
              `Sending audio to Eleven Labs for transcription (${audioType})...`
            );
            try {
              // Validate audio blob before sending
              if (audioBlob.size < 100) {
                console.warn(
                  "Audio blob is too small, likely not valid audio data"
                );
                return;
              }

              // Create a new blob with explicit type to ensure proper format
              const processedBlob = new Blob([await audioBlob.arrayBuffer()], {
                type: audioType,
              });

              // Log more details about the audio being sent
              console.log(
                `Sending audio to Eleven Labs: size=${processedBlob.size} bytes, type=${processedBlob.type}`
              );

              const transcription = await elevenLabsClient.speechToText.convert(
                {
                  file: processedBlob,
                  model_id: "scribe_v1",
                }
              );

              if (
                transcription &&
                transcription.text &&
                transcription.text.trim()
              ) {
                console.log("Transcription:", transcription.text);

                // Send the transcription to the agent
                send(
                  voiceContext,
                  {},
                  {
                    audioData: base64data,
                    audioType: audioType,
                  }
                );
              } else {
                console.warn("Received empty transcription from Eleven Labs");
              }
            } catch (transcriptionError) {
              console.error("Transcription error:", transcriptionError);

              // Try to save the audio file for debugging
              if (typeof window === "undefined") {
                try {
                  const fs = require("fs");
                  const path = require("path");
                  const extension = audioType.includes("mp3") ? "mp3" : "wav";
                  const debugFilePath = path.join(
                    "/tmp",
                    `debug-audio-${Date.now()}.${extension}`
                  );

                  // Convert Blob to Buffer
                  const arrayBuffer = await audioBlob.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);

                  // Write to file
                  fs.writeFileSync(debugFilePath, buffer);
                  console.log(
                    `Saved problematic audio to ${debugFilePath} for debugging`
                  );
                } catch (saveError) {
                  console.error("Failed to save debug audio file:", saveError);
                }
              }
            }
          } catch (error) {
            console.error("Error processing audio:", error);
          }
        };

        // Start recording and set up the handler
        await audioRecorder.startRecording(handleAudio);

        // Return cleanup function
        return () => {
          audioRecorder.stopRecording();
        };
      },
      async handler(params, ctx) {
        try {
          // Convert base64 string to Blob using our cross-platform function
          const bytes = decodeBase64(params.audioData);

          // Ensure we have a valid audio type
          let audioType = params.audioType;
          if (!audioType || audioType === "application/octet-stream") {
            // If no type or generic binary type, assume WAV
            audioType = "audio/wav";
            console.log(
              `No specific audio type detected in handler, using ${audioType}`
            );
          }

          // Create a blob with the specified audio type
          const audioBlob = new Blob([bytes], { type: audioType });

          console.log(
            `Processing audio in handler: size=${audioBlob.size} bytes, type=${audioType}`
          );

          if (audioBlob.size === 0) {
            console.warn(
              "Empty audio blob received in handler, skipping transcription"
            );
            return false;
          }

          if (audioBlob.size < 100) {
            console.warn(
              "Audio blob is too small, likely not valid audio data"
            );
            return false;
          }

          // Send to Eleven Labs for transcription
          try {
            // Create a new blob with explicit type to ensure proper format
            const processedBlob = new Blob([await audioBlob.arrayBuffer()], {
              type: audioType,
            });

            console.log(
              `Sending audio to Eleven Labs: size=${processedBlob.size} bytes, type=${processedBlob.type}`
            );

            const transcription = await elevenLabsClient.speechToText.convert({
              file: processedBlob,
              model_id: "scribe_v1",
            });

            // Store the transcription in working memory
            storeTranscriptionInMemory(ctx, transcription.text);
            console.log(
              "Successfully transcribed audio in handler:",
              transcription.text
            );

            // Return true to indicate success
            return true;
          } catch (transcriptionError) {
            console.error(
              "Transcription error in handler:",
              transcriptionError
            );

            // Try to save the audio file for debugging
            if (typeof window === "undefined") {
              try {
                const fs = require("fs");
                const path = require("path");
                const extension = audioType.includes("mp3") ? "mp3" : "wav";
                const debugFilePath = path.join(
                  "/tmp",
                  `debug-handler-audio-${Date.now()}.${extension}`
                );

                // Convert Blob to Buffer
                const arrayBuffer = await audioBlob.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Write to file
                fs.writeFileSync(debugFilePath, buffer);
                console.log(
                  `Saved problematic handler audio to ${debugFilePath} for debugging`
                );
              } catch (saveError) {
                console.error("Failed to save debug audio file:", saveError);
              }
            }

            return false;
          }
        } catch (error) {
          console.error("Speech-to-text error:", error);
          return false;
        }
      },
    }),
  },
});

/**
 * Legacy input to convert speech to text using Eleven Labs
 * This is kept for backward compatibility
 */
export const speechToText = input({
  schema: z.object({
    audioSource: z
      .string()
      .describe("URL or base64-encoded string of the audio to transcribe"),
    audioType: z
      .string()
      .default("audio/mp3")
      .describe("MIME type of the audio (e.g., 'audio/mp3', 'audio/wav')"),
    modelId: z
      .string()
      .default("scribe_v1")
      .describe("Eleven Labs model ID to use for transcription"),
  }),
  description: `Convert speech audio to text using Eleven Labs' speech-to-text API.

  USE WHEN:
  - You need to transcribe spoken content from an audio file
  - You want to process voice commands or dictation
  - You need to extract text from recorded meetings or conversations
  - You want to make voice content searchable or analyzable

  BEHAVIOR:
  - Accepts audio data as a URL or base64-encoded string
  - Sends the audio to Eleven Labs for processing
  - Returns the transcribed text
  - Stores the transcription in working memory for future reference

  PARAMETERS:
  - audioSource: URL or base64-encoded string of the audio to transcribe
  - audioType: MIME type of the audio (e.g., "audio/mp3", "audio/wav")
  - modelId: Optional Eleven Labs model ID to use for transcription

  BEST PRACTICE:
  - Provide clear, high-quality audio for best results
  - Use the appropriate model for your language and use case
  - Keep audio clips reasonably short for faster processing
  - Check the transcription for accuracy before using it for critical tasks
  `,
  async handler(params, ctx) {
    try {
      let audioBlob: Blob;

      // Ensure we have a valid audio type
      let audioType = params.audioType;
      if (!audioType || audioType === "application/octet-stream") {
        // If no type or generic binary type, assume MP3
        audioType = "audio/mp3";
        console.log(
          `No specific audio type detected in speechToText, using ${audioType}`
        );
      }

      // Check if audioSource is a URL or base64 string
      if (params.audioSource.startsWith("http")) {
        // It's a URL, fetch the audio
        const response = await fetch(params.audioSource);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.statusText}`);
        }
        // Create a blob with the specified audio type
        const arrayBuffer = await response.arrayBuffer();
        audioBlob = new Blob([arrayBuffer], { type: audioType });
      } else {
        // It's a base64 string, convert to Blob using our cross-platform function
        const bytes = decodeBase64(params.audioSource);
        audioBlob = new Blob([bytes], { type: audioType });
      }

      console.log(
        `Processing speechToText audio: size=${audioBlob.size} bytes, type=${audioType}`
      );

      if (audioBlob.size === 0) {
        console.warn(
          "Empty audio blob received in speechToText, skipping transcription"
        );
        return false;
      }

      if (audioBlob.size < 100) {
        console.warn("Audio blob is too small, likely not valid audio data");
        return false;
      }

      // Send to Eleven Labs for transcription
      try {
        // Create a new blob with explicit type to ensure proper format
        const processedBlob = new Blob([await audioBlob.arrayBuffer()], {
          type: audioType,
        });

        console.log(
          `Sending audio to Eleven Labs: size=${processedBlob.size} bytes, type=${processedBlob.type}`
        );

        const transcription = await elevenLabsClient.speechToText.convert({
          file: processedBlob,
          model_id: params.modelId,
        });

        // Store the transcription in working memory
        storeTranscriptionInMemory(ctx, transcription.text);
        console.log(
          "Successfully transcribed audio in speechToText:",
          transcription.text
        );

        // Return true to indicate success
        return true;
      } catch (transcriptionError) {
        console.error(
          "Transcription error in speechToText:",
          transcriptionError
        );

        // Try to save the audio file for debugging
        if (typeof window === "undefined") {
          try {
            const fs = require("fs");
            const path = require("path");
            const extension = audioType.includes("mp3") ? "mp3" : "wav";
            const debugFilePath = path.join(
              "/tmp",
              `debug-speechToText-${Date.now()}.${extension}`
            );

            // Convert Blob to Buffer
            const arrayBuffer = await audioBlob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Write to file
            fs.writeFileSync(debugFilePath, buffer);
            console.log(
              `Saved problematic speechToText audio to ${debugFilePath} for debugging`
            );
          } catch (saveError) {
            console.error("Failed to save debug audio file:", saveError);
          }
        }

        return false;
      }
    } catch (error) {
      console.error("Speech-to-text error:", error);
      return false;
    }
  },
  // Format the result for the agent
  format: (params) =>
    formatMsg({
      role: "user",
      user: "system",
      content: `Audio transcription requested for: ${params.audioSource.substring(0, 50)}...`,
    }),
});
