const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const speech = require('@google-cloud/speech');
const multer = require('multer');
const dotenv = require('dotenv')
const http = require('http');
const cors = require('cors')

const app = express();
const port = 3002;

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    cors({
      origin: 'http://localhost:3000',
      methods: ['POST'], 
      allowedHeaders: ['Content-Type'], 
    })
  );


const upload = multer({ storage: multer.memoryStorage() });


dotenv.config({ path: '/Users/aymaniktidar/Desktop/SpeechTranslator/translator/.env' });
const keyFilePath = process.env.GOOGLE_SPEECH_CREDENTIALS;
const credentials = JSON.parse(keyFilePath);

app.post('/recognize', upload.single('audio'), async (req, res) => {
    const client = new speech.SpeechClient({ credentials });
  const { languageCode } = req.body;
  const audio = req.file.buffer;

  const request = {
    config: {
      encoding: 'AAC', 
      sampleRateHertz: 48000, 
      languageCode: languageCode,
    },
    audio: {
      content: audio.toString('base64'),
    },
  };

  try {
    const [response] = await client.recognize(request);
    //console.log(client)
    //console.log(audio)
    //console.log(response)
    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join('\n');
    console.log(transcription)
    res.json({ transcription });
  } catch (err) {
    console.error('Google Cloud Speech API error:', err);
    res.status(500).json({ error: 'Failed to recognize speech.' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
