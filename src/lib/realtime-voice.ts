// OpenAI Realtime API Voice Integration for HireInbox AI Interviews
// Uses WebSocket connection for real-time voice conversation
// Documentation: https://platform.openai.com/docs/guides/realtime

export interface RealtimeConfig {
  apiKey: string;
  model?: string;
  voice?: 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse';
  instructions?: string;
  temperature?: number;
  maxResponseTokens?: number;
  turnDetection?: {
    type: 'server_vad';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  } | null;
}

export interface TranscriptItem {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  audioId?: string;
}

export interface RealtimeEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onTranscript?: (transcript: TranscriptItem) => void;
  onAudioDelta?: (delta: ArrayBuffer) => void;
  onInputAudioTranscript?: (text: string) => void;
  onResponseDone?: () => void;
  onSpeechStarted?: () => void;
  onSpeechEnded?: () => void;
  onInterrupted?: () => void;
}

export type RealtimeState = 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'processing';

/**
 * OpenAI Realtime Voice Client
 * Manages WebSocket connection to OpenAI Realtime API for voice interviews
 */
export class RealtimeVoiceClient {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;
  private events: RealtimeEvents;
  private state: RealtimeState = 'disconnected';
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying: boolean = false;
  private currentResponseId: string | null = null;
  private transcripts: TranscriptItem[] = [];
  private pendingAudioChunks: Uint8Array[] = [];

  constructor(config: RealtimeConfig, events: RealtimeEvents = {}) {
    this.config = {
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'alloy',
      temperature: 0.8,
      maxResponseTokens: 4096,
      turnDetection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      ...config,
    };
    this.events = events;
  }

  getState(): RealtimeState {
    return this.state;
  }

  getTranscripts(): TranscriptItem[] {
    return [...this.transcripts];
  }

  private setState(newState: RealtimeState) {
    this.state = newState;
  }

  /**
   * Connect to OpenAI Realtime API via WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws) {
      this.disconnect();
    }

    this.setState('connecting');

    return new Promise((resolve, reject) => {
      try {
        // OpenAI Realtime API WebSocket endpoint
        const wsUrl = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;

        this.ws = new WebSocket(wsUrl, [
          'realtime',
          `openai-insecure-api-key.${this.config.apiKey}`,
          'openai-beta.realtime-v1',
        ]);

        this.ws.onopen = () => {
          console.log('[Realtime] WebSocket connected');
          this.setState('connected');
          this.configureSession();
          this.events.onConnect?.();
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log('[Realtime] WebSocket closed:', event.code, event.reason);
          this.setState('disconnected');
          this.events.onDisconnect?.();
        };

        this.ws.onerror = (event) => {
          console.error('[Realtime] WebSocket error:', event);
          const error = new Error('WebSocket connection failed');
          this.events.onError?.(error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

      } catch (error) {
        console.error('[Realtime] Connection error:', error);
        this.setState('disconnected');
        reject(error);
      }
    });
  }

  /**
   * Configure the session with instructions and settings
   */
  private configureSession() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.instructions || this.getDefaultInstructions(),
        voice: this.config.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: this.config.turnDetection,
        temperature: this.config.temperature,
        max_response_output_tokens: this.config.maxResponseTokens,
      },
    };

    this.sendMessage(sessionConfig);
    console.log('[Realtime] Session configured');
  }

  private getDefaultInstructions(): string {
    return `You are a professional AI interviewer for HireInbox, conducting voice interviews for South African companies.

Your role:
- Ask clear, focused questions one at a time
- Listen carefully and ask follow-up questions when needed
- Be warm but professional
- Probe for specific examples and evidence
- Note key achievements and concerns

Interview style:
- Start with a brief greeting and explanation of the process
- Ask about their background and experience
- Probe for specific achievements with metrics
- Ask behavioral questions (STAR format)
- Allow candidate to ask questions at the end

Remember:
- Keep responses concise for voice (2-3 sentences max)
- Pause appropriately for the candidate to respond
- Acknowledge good answers before moving on
- Be encouraging but objective`;
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string) {
    try {
      const event = JSON.parse(data);

      switch (event.type) {
        case 'session.created':
          console.log('[Realtime] Session created:', event.session?.id);
          break;

        case 'session.updated':
          console.log('[Realtime] Session updated');
          break;

        case 'input_audio_buffer.speech_started':
          this.setState('listening');
          this.events.onSpeechStarted?.();
          break;

        case 'input_audio_buffer.speech_stopped':
          this.events.onSpeechEnded?.();
          break;

        case 'input_audio_buffer.committed':
          this.setState('processing');
          break;

        case 'conversation.item.created':
          this.handleConversationItem(event.item);
          break;

        case 'conversation.item.input_audio_transcription.completed':
          this.handleInputTranscription(event);
          break;

        case 'response.created':
          this.currentResponseId = event.response?.id;
          this.setState('speaking');
          break;

        case 'response.audio.delta':
          this.handleAudioDelta(event.delta);
          break;

        case 'response.audio_transcript.delta':
          // Real-time transcript of AI speech
          break;

        case 'response.audio_transcript.done':
          this.handleResponseTranscript(event);
          break;

        case 'response.done':
          this.handleResponseDone(event);
          break;

        case 'response.cancelled':
          this.events.onInterrupted?.();
          break;

        case 'error':
          console.error('[Realtime] Error:', event.error);
          this.events.onError?.(new Error(event.error?.message || 'Unknown error'));
          break;

        default:
          // console.log('[Realtime] Unhandled event:', event.type);
          break;
      }
    } catch (error) {
      console.error('[Realtime] Failed to parse message:', error);
    }
  }

  private handleConversationItem(item: { type: string; role?: string; id?: string }) {
    if (item.type === 'message') {
      console.log('[Realtime] New message from:', item.role);
    }
  }

  private handleInputTranscription(event: { transcript?: string; item_id?: string }) {
    const text = event.transcript;
    if (text) {
      const transcript: TranscriptItem = {
        role: 'user',
        text: text,
        timestamp: Date.now(),
        audioId: event.item_id,
      };
      this.transcripts.push(transcript);
      this.events.onInputAudioTranscript?.(text);
      this.events.onTranscript?.(transcript);
    }
  }

  private handleResponseTranscript(event: { transcript?: string; item_id?: string }) {
    const text = event.transcript;
    if (text) {
      const transcript: TranscriptItem = {
        role: 'assistant',
        text: text,
        timestamp: Date.now(),
        audioId: event.item_id,
      };
      this.transcripts.push(transcript);
      this.events.onTranscript?.(transcript);
    }
  }

  private handleAudioDelta(delta: string) {
    if (!delta) return;

    // Decode base64 audio chunk
    const binaryString = atob(delta);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    this.events.onAudioDelta?.(bytes.buffer);
    this.queueAudioForPlayback(bytes.buffer);
  }

  private handleResponseDone(event: { response?: { status?: string } }) {
    console.log('[Realtime] Response done:', event.response?.status);
    this.setState('connected');
    this.events.onResponseDone?.();
  }

  /**
   * Start microphone capture and send audio to API
   */
  async startMicrophone(): Promise<void> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create AudioContext for processing
      this.audioContext = new AudioContext({ sampleRate: 24000 });

      // Create a script processor for real-time audio capture
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (this.ws?.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = this.floatTo16BitPCM(inputData);
        this.sendAudioChunk(pcm16);
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      console.log('[Realtime] Microphone started');
      this.setState('listening');

    } catch (error) {
      console.error('[Realtime] Microphone error:', error);
      throw error;
    }
  }

  /**
   * Convert float32 audio to 16-bit PCM
   */
  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return buffer;
  }

  /**
   * Send audio chunk to API
   */
  private sendAudioChunk(pcmData: ArrayBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const base64Audio = this.arrayBufferToBase64(pcmData);

    this.sendMessage({
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Queue audio for playback
   */
  private async queueAudioForPlayback(audioData: ArrayBuffer) {
    this.audioQueue.push(audioData);

    if (!this.isPlaying) {
      this.playAudioQueue();
    }
  }

  private async playAudioQueue() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;

    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
    }

    // Combine all queued chunks
    const combinedLength = this.audioQueue.reduce((acc, buf) => acc + buf.byteLength, 0);
    const combined = new Uint8Array(combinedLength);
    let offset = 0;

    while (this.audioQueue.length > 0) {
      const chunk = this.audioQueue.shift()!;
      combined.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    // Convert 16-bit PCM to Float32
    const float32 = new Float32Array(combined.length / 2);
    const dataView = new DataView(combined.buffer);

    for (let i = 0; i < float32.length; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      float32[i] = int16 / 32768;
    }

    // Create audio buffer and play
    const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    source.onended = () => {
      this.playAudioQueue();
    };

    source.start();
  }

  /**
   * Stop microphone capture
   */
  stopMicrophone() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    console.log('[Realtime] Microphone stopped');
  }

  /**
   * Send a text message to the conversation
   */
  sendTextMessage(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.sendMessage({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          },
        ],
      },
    });

    // Request a response
    this.sendMessage({ type: 'response.create' });
  }

  /**
   * Interrupt current response
   */
  interrupt() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Cancel current response
    this.sendMessage({ type: 'response.cancel' });

    // Clear audio queue
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Commit audio buffer and get response
   */
  commitAudioBuffer() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.sendMessage({ type: 'input_audio_buffer.commit' });
  }

  /**
   * Clear audio buffer
   */
  clearAudioBuffer() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.sendMessage({ type: 'input_audio_buffer.clear' });
  }

  /**
   * Send message via WebSocket
   */
  private sendMessage(message: object) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[Realtime] Cannot send message - not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Disconnect from the API
   */
  disconnect() {
    this.stopMicrophone();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.audioQueue = [];
    this.isPlaying = false;
    this.setState('disconnected');
    console.log('[Realtime] Disconnected');
  }
}

/**
 * Interview-specific wrapper for RealtimeVoiceClient
 */
export class VoiceInterviewClient extends RealtimeVoiceClient {
  private candidateInfo: {
    name: string;
    cvSummary: string;
    roleTitle: string;
    focusAreas: string[];
  } | null = null;

  private interviewPhase: 'intro' | 'questions' | 'candidate_questions' | 'closing' = 'intro';
  private questionsAsked: number = 0;
  private maxQuestions: number = 8;

  setCandidateInfo(info: {
    name: string;
    cvSummary: string;
    roleTitle: string;
    focusAreas: string[];
  }) {
    this.candidateInfo = info;
  }

  getInterviewInstructions(): string {
    if (!this.candidateInfo) {
      return this.getGenericInstructions();
    }

    return `You are a professional AI interviewer for HireInbox, conducting a voice interview for the ${this.candidateInfo.roleTitle} position.

CANDIDATE INFORMATION:
Name: ${this.candidateInfo.name}
CV Summary: ${this.candidateInfo.cvSummary}
Focus Areas to Explore: ${this.candidateInfo.focusAreas.join(', ')}

INTERVIEW STRUCTURE (10-15 minutes total):

1. INTRODUCTION (1-2 min):
   - Greet ${this.candidateInfo.name} warmly
   - Explain this is an AI-assisted screening interview
   - Let them know the conversation is being recorded for review
   - Ask if they have any questions before starting

2. BACKGROUND QUESTIONS (3-4 min):
   - Ask about their current role and key responsibilities
   - Probe for specific achievements with metrics
   - Understand their career progression

3. ROLE-SPECIFIC QUESTIONS (5-6 min):
   - Focus on the areas: ${this.candidateInfo.focusAreas.join(', ')}
   - Ask behavioral questions (STAR format)
   - Probe for evidence of claimed skills

4. CANDIDATE QUESTIONS (2 min):
   - Ask if they have questions about the role or company
   - Answer honestly or say you'll pass their question to the hiring team

5. CLOSING (1 min):
   - Thank them for their time
   - Explain next steps (hiring team will review)
   - End professionally

INTERVIEW RULES:
- Keep responses SHORT (2-3 sentences max) - this is voice, not text
- Ask ONE question at a time
- Listen for red flags: vague answers, inconsistencies, evasion
- Listen for green flags: specific examples, metrics, clear progression
- If answer is vague, ask a follow-up: "Can you give me a specific example?"
- Be encouraging but objective
- Note anything that doesn't match their CV

SOUTH AFRICAN CONTEXT:
- Understand SA qualifications: CA(SA) is gold standard, Big 4 experience is valuable
- Know local companies: Investec, Discovery, Standard Bank, PwC, etc.
- Be aware of load shedding and remote work realities
- Understand BEE context if relevant

BEGIN by greeting ${this.candidateInfo.name} and explaining the interview process.`;
  }

  private getGenericInstructions(): string {
    return `You are a professional AI interviewer for HireInbox.

INTERVIEW RULES:
- Keep responses SHORT (2-3 sentences max) - this is voice
- Ask ONE question at a time
- Listen for specific examples and metrics
- If answer is vague, probe deeper
- Be professional and encouraging

Start with a brief greeting and ask about their background.`;
  }

  getPhase(): string {
    return this.interviewPhase;
  }

  getQuestionsAsked(): number {
    return this.questionsAsked;
  }

  setMaxQuestions(max: number) {
    this.maxQuestions = max;
  }
}

export default RealtimeVoiceClient;
