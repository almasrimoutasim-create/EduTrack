import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

async function run() {
  const docxPath = 'جدول_الحصص_العربي_RTL.docx';
  try {
    const result = await mammoth.convertToHtml({ path: docxPath });
    const html = result.value; // The generated HTML
    const messages = result.messages; // Any messages, such as warnings during conversion
    
    fs.writeFileSync('scratch/docx_content.html', html);
    console.log('Successfully converted docx to html and saved to scratch/docx_content.html');
    
    const textResult = await mammoth.extractRawText({ path: docxPath });
    fs.writeFileSync('scratch/docx_content.txt', textResult.value);
    console.log('Successfully extracted raw text and saved to scratch/docx_content.txt');
  } catch (err) {
    console.error('Error reading DOCX:', err);
  }
}
run();
