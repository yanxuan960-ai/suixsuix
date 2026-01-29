import { useState, useCallback, useEffect } from 'react';

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'zh-CN';

      recog.onstart = () => setIsListening(true);
      recog.onend = () => setIsListening(false);
      recog.onerror = (event: any) => {
        // 如果是 abort 导致的 error (aborted)，通常不视为错误
        if (event.error !== 'aborted') {
          setError(event.error);
        }
        setIsListening(false);
      };
      recog.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
      };

      setRecognition(recog);
    } else {
      setError('浏览器不支持语音识别');
    }
  }, []);

  const startListening = useCallback(() => {
    setTranscript('');
    setError(null);
    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        console.error("Speech recognition start failed", e);
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      // onend will handle setIsListening(false)
    }
  }, [recognition]);

  const abortListening = useCallback(() => {
    if (recognition) {
      recognition.abort();
      setIsListening(false);
      setTranscript(''); // 关键：取消时清空内容，防止上屏
    }
  }, [recognition]);

  return { isListening, transcript, error, startListening, stopListening, abortListening, setTranscript };
};