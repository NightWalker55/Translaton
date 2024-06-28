import { NextResponse } from 'next/server';
import { v2 as translateV2 } from '@google-cloud/translate';
import path from 'path';
import dotenv from 'dotenv';


dotenv.config({ path: path.resolve(process.cwd(), 'key.env') });

const keyFilePath = path.resolve(process.cwd(), './keys/service_key.json');


const translate = new translateV2.Translate({
  projectId: "translator-427811",
  keyFilename: keyFilePath,
});

export async function POST(request) {
  const { text, target } = await request.json();

  try {
    const [translation] = await translate.translate(text, target);
    return NextResponse.json({ translatedText: translation });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}