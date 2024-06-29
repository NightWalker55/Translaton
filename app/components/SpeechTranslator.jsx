'use client';

import { useState, useEffect } from 'react';
import { languages } from '../languages';

const SpeechTranslator = () => {
  const [isListening, setIsListening] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState("English (USA)");
  const [targetedLanguage, setTargetedLanguage] = useState("English (USA)");
  const [recognition, setRecognition] = useState(null); // State to hold recognition instance

  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [recognition]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognitionInstance = new webkitSpeechRecognition();
    const speechLang = languages.find(lang => lang.name === speechLanguage);
    if (!speechLang) {
      setError('Selected speech language is not supported.');
      return;
    }
    recognitionInstance.lang = speechLang.code;
    recognitionInstance.interimResults = false;
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setTranslatedText('');
    };

    recognitionInstance.onresult = (event) => {
      if(!isListening){
        const speechResult = event.results[0][0].transcript;
        setTranslatedText(speechResult); 
      }
    };

    recognitionInstance.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    setRecognition(recognitionInstance);
    recognitionInstance.start();
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      if (translatedText.trim() !== '') {
        translateText(translatedText);
      }
    }
  };

  const translateText = async (text) => {
    try {
      const targetLang = languages.find(lang => lang.name === targetedLanguage);
      if (!targetLang) {
        setError('Selected target language is not supported.');
        return;
      }
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, target: targetLang.code }),
      });

      const data = await response.json();
      if (data.error) {
        setError(`Translation error: ${data.error}`);
      } else {
        setTranslatedText(data.translatedText);
      }
    } catch (error) {
      setError('Translation error: ' + error.message);
    }
  };

  return (
    <div className='flex flex-col justify-center items-center p-5 max-w-full'>
      <h3 className='my-3 text-2xl text-white text-center'>Choose the language you want to speak</h3>
      <select className='my-3 w-full max-w-xs h-10 rounded-lg text-black p-2 border border-gray-300' onChange={(e) => setSpeechLanguage(e.target.value)} value={speechLanguage}>
        {languages.map((lang, key) => (
          <option key={key} value={lang.name}>
            {lang.name}
          </option>
        ))}
      </select>
      <h3 className='my-3 text-2xl text-white text-center'>Choose the language you want to translate to</h3>
      <select className='my-3 w-full max-w-xs h-10 rounded-lg text-black p-2 border border-gray-300' onChange={(e) => setTargetedLanguage(e.target.value)} value={targetedLanguage}>
        {languages.map((lang, key) => (
          <option key={key} value={lang.name}>
            {lang.name}
          </option>
        ))}
      </select>
      <br />
      <button 
        className='bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md 
        hover:bg-blue-800 transition duration-300 w-full max-w-xs' 
        onClick={startListening} 
        disabled={isListening}>
        {isListening ? 'Listening...' : 'Start Speaking'}
      </button>
      <button
        className='bg-red-700 text-white px-4 py-2 rounded-lg shadow-md 
        hover:bg-red-800 transition duration-300 w-full max-w-xs mt-3'
        onClick={stopListening}
        disabled={!isListening}>
        Stop Speaking
      </button>
      {translatedText && !isListening && (
        <div className="mt-6 w-full max-w-md p-4 bg-gray-100 rounded-lg shadow-md">
          <p className="text-lg font-semibold text-gray-800 mb-2">Translated text in {targetedLanguage}:</p>
          <p className="text-xl text-gray-900">{translatedText}</p>
        </div>
      )}
      {error && <p className='text-red-500 mt-4 text-center'>{error}</p>}
    </div>
  );
};

export default SpeechTranslator;
