
"use client"

import { useState, useRef, useEffect } from 'react';
import { languages } from '../languages';
import axios from 'axios';

const SpeechTranslator = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState('English (USA)');
  const [targetedLanguage, setTargetedLanguage] = useState('English (USA)');
  const [speechCode, setSpeechCode] = useState('en-US');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    if (translatedText && !isRecording) {
      translateText(translatedText);
    }
  }, [targetedLanguage]);

  const handleSpeechLanguageChange = (selectedLanguage) => {
    const lang = languages.find((lang) => lang.name === selectedLanguage).code;
    setSpeechCode(lang);
    setSpeechLanguage(selectedLanguage);
  };

  const startRecording = async () => {
    try {
      if (mediaRecorderRef.current) {
        console.warn('MediaRecorder is already active.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm; codecs=opus',
        audioBitsPerSecond: 48000,
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      audioChunksRef.current = [];
    } catch (err) {
      setError(`Could not start recording: ${err.message}`);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      console.warn('MediaRecorder is not active.');
      return;
    }
  
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  
    await new Promise((resolve) => setTimeout(resolve, 1000));
  
    const audioChunks = audioChunksRef.current;
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
  
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('languageCode', speechCode);
  
    try {
      const response = await axios.post('hhttps://translaton.vercel.app', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      if (response.status !== 200) {
        throw new Error('Failed to recognize speech. Status: ' + response.status);
      }
  
      const { transcription } = response.data;
      translateText(transcription);
    } catch (err) {
      setError(`API request error: ${err.message}`);
      console.error('API request error:', err); 
    }
  };
  

  const translateText = async (text) => {
    try {
      const targetLang = languages.find((lang) => lang.name === targetedLanguage);
      if (!targetLang) {
        setError('Selected target language is not supported.');
        return;
      }

      const response = await axios.post('/api/translate', {
        text,
        target: targetLang.code,
      });

      if (response.status !== 200) {
        throw new Error('Failed to translate text.');
      }
      const { translatedText } = response.data;
      setTranslatedText(translatedText);
    } catch (error) {
      setError(`Translation error: ${error.message}`);
    }
  };

  return (
    <div className='flex flex-col justify-center items-center p-5 max-w-full'>
      <h3 className='my-3 text-2xl text-white text-center'>Choose the language you want to speak</h3>
      <select
        className='my-3 w-full max-w-xs h-10 rounded-lg text-black p-2 border border-gray-300'
        onChange={(e) => handleSpeechLanguageChange(e.target.value)}
        value={speechLanguage}
      >
        {languages.map((lang, key) => (
          <option key={key} value={lang.name}>
            {lang.name}
          </option>
        ))}
      </select>
      <h3 className='my-3 text-2xl text-white text-center'>Choose the language you want to translate to</h3>
      <select
        className='my-3 w-full max-w-xs h-10 rounded-lg text-black p-2 border border-gray-300'
        onChange={(e) => setTargetedLanguage(e.target.value)}
        value={targetedLanguage}
      >
        {languages.map((lang, key) => (
          <option key={key} value={lang.name}>
            {lang.name}
          </option>
        ))}
      </select>
      <br />
      <button
        className='bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-800 transition duration-300 w-full max-w-xs'
        onClick={startRecording}
        disabled={isRecording}
      >
        {isRecording ? 'Recording...' : 'Start Recording'}
      </button>
      <button
        className='bg-red-700 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-800 transition duration-300 w-full max-w-xs mt-3'
        onClick={stopRecording}
        disabled={!isRecording}
      >
        Stop Recording
      </button>
      {translatedText && !isRecording && (
        <div className='mt-6 w-full max-w-md p-4 bg-gray-100 rounded-lg shadow-md'>
          <p className='text-lg font-semibold text-gray-800 mb-2'>Translated text in {targetedLanguage}:</p>
          <p className='text-xl text-gray-900'>{translatedText}</p>
        </div>
      )}
      {error && <p className='text-red-500 mt-4 text-center'>{error}</p>}
    </div>
  );
};

export default SpeechTranslator;
