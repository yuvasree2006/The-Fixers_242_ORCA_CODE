/**
 * VoiceService: Wrapper for browser-native Web Speech API (SpeechRecognition + speechSynthesis)
 * HARD CONSTRAINT GUARANTEE: Zero external keys or signups. 100% key-free browser standard.
 */

class VoiceService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSupported = false;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    
    // Check SpeechRecognition browser support
    const SpeechRecognition = typeof window !== 'undefined' && 
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
    }
  }

  startListening({ speechLang = 'en-US', onResult, onError, onEnd }) {
    if (!this.isSupported || !this.recognition) {
      if (onError) onError('SpeechRecognition is not supported in this browser.');
      return;
    }

    try {
      this.recognition.lang = speechLang;
      this.isListening = true;

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (onResult) onResult(transcript);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        console.warn('SpeechRecognition error:', event.error);
        if (onError) onError(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
    } catch (err) {
      this.isListening = false;
      if (onError) onError(err.message);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text, speechLang = 'en-US') {
    if (!this.synth) return;

    // Cancel any ongoing speech
    this.synth.cancel();

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 0.95; // Slightly clearer pace for coastal announcements

    // Attempt to pick a voice matching language prefix (e.g. 'hi', 'ta', 'te', 'ml', 'bn', 'en')
    const voices = this.synth.getVoices();
    const langPrefix = speechLang.split('-')[0];
    const matchingVoice = voices.find(v => v.lang.startsWith(langPrefix));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const voiceService = new VoiceService();
