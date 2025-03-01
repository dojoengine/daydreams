# Voice Extension for Daydreams

This extension enables voice input capabilities for Daydreams agents using
Eleven Labs for speech-to-text transcription.

## Features

- Real-time audio recording from the browser's microphone
- Automatic transcription of audio using Eleven Labs
- Seamless integration with Daydreams agent system
- Chunked audio processing for better performance

## Prerequisites

- Eleven Labs API key (get one at
  [https://elevenlabs.io](https://elevenlabs.io))
- Groq API key (for the example)
- Browser environment with microphone access

## Installation

1. Make sure you have the required dependencies:

```bash
npm install elevenlabs @ai-sdk/groq
```

2. Set up your environment variables:

```bash
export ELEVENLABS_API_KEY=your_elevenlabs_api_key
export GROQ_API_KEY=your_groq_api_key
```

## Usage

### Basic Setup

```typescript
import { createDreams } from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";
import { voice } from "./voice-actions";
import { createGroq } from "@ai-sdk/groq";

// Initialize Groq client
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Create a new Dreams instance with voice extension
const agent = await createDreams({
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [cli, voice],
}).start();
```

### Running the Example

To run the included example:

```bash
npm run example:voice
```

This will start a voice assistant that listens for audio input and responds to
your voice commands.

## How It Works

1. The voice extension initializes an audio recorder service when the agent
   starts
2. The service uses the browser's MediaRecorder API to capture audio from the
   microphone
3. Audio is recorded in 5-second chunks for efficient processing
4. Each chunk is sent to Eleven Labs for transcription
5. The transcribed text is sent to the agent for processing
6. The agent can respond using the CLI interface or other output methods

## Customization

You can customize the voice extension by:

- Changing the recording chunk duration
- Using a different speech-to-text provider
- Adding voice output capabilities
- Implementing wake word detection

## Limitations

- Currently only works in browser environments
- Requires microphone permissions
- Audio quality affects transcription accuracy
- Network latency can impact real-time performance

## License

This extension is part of the Daydreams project and is subject to the same
license terms.
