// High-Fidelity Web Audio Synthesizer & Speech Synthesis for Natasha V.I.

class SoundEffectManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // 1. WELCOME SOUND: Majestic, futuristic startup chime chord progression
  public playWelcomeSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Chord frequencies: C4 (261.63), G4 (392.00), C5 (523.25), E5 (659.25), G5 (783.99)
      const freqs = [261.63, 392.00, 523.25, 659.25, 783.99];
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.25, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
      masterGain.connect(ctx.destination);

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const delay = idx * 0.12;

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        noteGain.gain.setValueAtTime(0, now + delay);
        noteGain.gain.linearRampToValueAtTime(0.2, now + delay + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.8);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + delay);
        osc.stop(now + delay + 1.85);
      });
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  }

  // 2. LOCK SOUND: Solid metallic cybernetic latch / servo power down
  public playLockSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Noise burst for mechanical click
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1200, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);

      // Pitch dropping heavy lock tone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(500, now);

      osc.connect(lowpass);
      lowpass.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  }

  // 3. UNLOCK SOUND: Rapid ascending harmonic cyber unlock chime
  public playUnlockSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const tones = [587.33, 880.00, 1174.66]; // D5, A5, D6
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  }

  // 4. WRONG INPUT SOUND: Distinct low buzz error tone
  public playWrongInputSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Two quick error pulses
      [0, 0.14].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + offset;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, start);
        osc.frequency.setValueAtTime(110, start + 0.05);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, start);

        gain.gain.setValueAtTime(0.28, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.11);
      });
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  }

  // 5. ACCESS GRANTED SOUND: Bright, crystalline affirmative double chime
  public playAccessGrantedSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const notes = [
        { freq: 784, time: 0, dur: 0.18 },    // G5
        { freq: 1046.5, time: 0.12, dur: 0.4 } // C6
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur + 0.05);
      });
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  }

  // 6. REMINDER SOUND: Dual bell resonance alert ping
  public playReminderSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const pings = [
        { freq: 880, time: 0, dur: 0.6 },     // A5
        { freq: 1318.5, time: 0.15, dur: 0.8 } // E6
      ];

      pings.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + time;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur + 0.05);
      });
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  }

  // 7. CLICK SOUND: Crisp high-tech tactile click
  public playClickSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn('Click audio error:', e);
    }
  }

  // 8. ZIP SUCCESS SOUND: Ascending arpeggio
  public playZipSuccessSound() {
    this.playAccessGrantedSound();
  }

  // 9. DELETE SOUND: Low metallic descent
  public playDeleteSound() {
    this.playLockSound();
  }

  // 10. NOTIFICATION SOUND: High crystalline glass ping
  public playNotificationSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1318.5, now);
      osc.frequency.setValueAtTime(1975.5, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.52);
    } catch (e) {
      console.warn('Notification audio error:', e);
    }
  }

  // 11. PROCESSING PULSE: Soft futuristic radar sweep
  public playProcessingSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(392, now);
      osc.frequency.linearRampToValueAtTime(587.33, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Processing audio error:', e);
    }
  }

  // 12. CELEBRATION SOUND: Bright major arpeggio
  public playCelebrationSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.09;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch (e) {
      console.warn('Celebration audio error:', e);
    }
  }
}

export const soundManager = new SoundEffectManager();

// ==========================================
// NATASHA FEMALE ENGLISH SPEECH SYNTHESIS
// ==========================================

// Cache available voices and prime speech engine
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
    } catch (e) {
      console.warn('Unable to load speech voices:', e);
    }
  };

  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

// Clean text for speech synthesis so Natasha sounds natural and fluent
export const sanitizeSpeechText = (rawText: string): string => {
  if (!rawText) return '';
  return rawText
    // Remove binary prefixes or system metadata headers
    .replace(/^\[SYSTEM.*?\]/gi, '')
    .replace(/^\[.*?\]/g, '')
    // Remove URLs
    .replace(/https?:\/\/\S+/gi, '')
    // Remove markdown code blocks and backticks
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown headers and asterisks/formatting
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove list markers and table pipes
    .replace(/^[\s*•\-–—]+\s*/gm, '')
    .replace(/\|/g, ', ')
    // Remove technical symbols and brackets
    .replace(/[[\]{}<>~^]/g, '')
    // Replace multiple newlines or spaces
    .replace(/\s+/g, ' ')
    .trim();
};

// Best female voice selector
export const getBestFemaleVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  let voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    return null;
  }

  // Priority female voice name indicators
  const femaleKeywords = [
    'zira',
    'samantha',
    'victoria',
    'karen',
    'moira',
    'serena',
    'hazel',
    'jenny',
    'aria',
    'sonia',
    'libby',
    'mia',
    'fiona',
    'tessa',
    'ava',
    'allison',
    'susan',
    'veena',
    'female',
    'woman',
    'girl',
    'google uk english female',
    'google us english female',
    'en-us-neural2-f',
    'en-us-standard-c',
    'en-us-standard-e'
  ];

  // 1. First priority: English female voice
  const englishFemale = voices.find(v => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    return (
      (lang.startsWith('en') || lang.includes('en-')) &&
      femaleKeywords.some(kw => name.includes(kw))
    );
  });
  if (englishFemale) return englishFemale;

  // 2. Second priority: Any English voice with female tone
  const anyFemale = voices.find(v => {
    const name = v.name.toLowerCase();
    return femaleKeywords.some(kw => name.includes(kw));
  });
  if (anyFemale) return anyFemale;

  // 3. Third priority: Natural/Online English voice
  const englishNatural = voices.find(v => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    return lang.startsWith('en') && (name.includes('natural') || name.includes('online') || name.includes('google'));
  });
  if (englishNatural) return englishNatural;

  // 4. Default fallback: Any English voice
  return voices.find(v => v.lang.toLowerCase().startsWith('en')) || voices[0] || null;
};

export const getNatashaVoiceLabel = (): string => {
  const voice = getBestFemaleVoice();
  if (!voice) return 'Default Female Synthesizer';
  return voice.name.replace(/(Google|Microsoft|Apple)\s*/gi, '').trim() || 'Natasha Female Voice';
};

export const isNatashaSpeaking = (): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  return window.speechSynthesis.speaking;
};

export const speakNatasha = (text: string, onEnd?: () => void) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Prepare text
    let cleanText = sanitizeSpeechText(text);
    if (!cleanText) {
      onEnd?.();
      return;
    }

    // Limit maximum continuous spoken speech to 500 characters to prevent endless loops on large reports
    if (cleanText.length > 500) {
      cleanText = cleanText.substring(0, 480) + '... Directive and details available on your display screen, Boss.';
    }

    // Ensure Natasha addresses user as Boss
    if (!cleanText.toLowerCase().includes('boss')) {
      cleanText = `Boss, ${cleanText}`;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const femaleVoice = getBestFemaleVoice();

    if (femaleVoice) {
      utterance.voice = femaleVoice;
      // If the voice name explicitly contains female indicators, standard female pitch
      const isExplicitFemale = ['zira', 'samantha', 'victoria', 'karen', 'moira', 'serena', 'hazel', 'jenny', 'aria', 'female', 'woman'].some(kw => femaleVoice.name.toLowerCase().includes(kw));
      utterance.pitch = isExplicitFemale ? 1.18 : 1.28; // Elevate pitch for unmistakable female register
      utterance.rate = 1.02; // Crisply paced, high-tech cadence
    } else {
      utterance.pitch = 1.25; // Female pitch register
      utterance.rate = 1.0;
    }

    utterance.volume = 1.0;

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        onEnd?.();
      }
    };

    utterance.onend = finish;
    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error:', e);
      finish();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
    onEnd?.();
  }
};

export const stopNatashaSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
