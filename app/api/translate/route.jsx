import { NextResponse } from 'next/server';
import { v2 as translateV2 } from '@google-cloud/translate';
import dotenv from 'dotenv';

dotenv.config();

const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const credentials = JSON.parse(keyFilePath);



const translate = new translateV2.Translate({
    projectId: credentials.project_id,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
});

export async function POST(request) {
  const { text, target } = await request.json();
  try {
    console.log('Received text:', text);
    console.log('Target language:', target);
    const [translation] = await translate.translate(text, target);
    return NextResponse.json({ translatedText: translation });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
