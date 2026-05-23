import { NextResponse } from 'next/server';
import CloudConvert from 'cloudconvert';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const targetFormat = formData.get('targetFormat'); // e.g., 'mp4', 'pdf', 'mp3'

    if (!file || !targetFormat) {
      return NextResponse.json({ error: 'File and target format are required.' }, { status: 400 });
    }

    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'System Note: CLOUDCONVERT_API_KEY is missing in Vercel Environment Variables. Please add it to enable Universal Conversion.' 
      }, { status: 500 });
    }

    const cloudConvert = new CloudConvert(apiKey);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Create a Job on CloudConvert
    const job = await cloudConvert.jobs.create({
      tasks: {
        'import-my-file': {
          operation: 'import/base64',
          file: buffer.toString('base64'),
          filename: file.name
        },
        'convert-my-file': {
          operation: 'convert',
          input: 'import-my-file',
          output_format: targetFormat.toLowerCase()
        },
        'export-my-file': {
          operation: 'export/url',
          input: 'convert-my-file'
        }
      }
    });

    // 2. Wait for the Job to finish (Polling)
    const finishedJob = await cloudConvert.jobs.wait(job.id);

    // 3. Extract the download URL
    const exportTask = finishedJob.tasks.filter(task => task.name === 'export-my-file')[0];
    const fileData = exportTask.result.files[0];

    return NextResponse.json({ 
      success: true, 
      downloadUrl: fileData.url,
      fileName: fileData.filename
    }, { status: 200 });

  } catch (error) {
    console.error('Universal Conversion Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to convert file. Format might be unsupported or file too large for serverless timeout.' 
    }, { status: 500 });
  }
}
