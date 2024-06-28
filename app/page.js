import SpeechTranslator from './components/SpeechTranslator';
import About from './components/About';

export default function Home() {

  return (
      <main className='min-h-screen bg-gradient-to-r from-purple-400 to-gray-900'> 
        <About/>
        <SpeechTranslator />
      </main>
    
  );
}