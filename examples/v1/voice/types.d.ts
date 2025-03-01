/**
 * Type declarations for node-record-lpcm16
 */
declare module "node-record-lpcm16" {
  interface RecordOptions {
    sampleRate?: number;
    channels?: number;
    audioType?: string;
    threshold?: number;
    recordProgram?: string;
    silence?: string;
    verbose?: boolean;
    device?: string;
  }

  interface Recorder {
    stream(): NodeJS.ReadableStream;
    stop(): void;
  }

  export function record(options?: RecordOptions): Recorder;
}
