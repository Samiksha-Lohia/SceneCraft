import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { downloadFile } from '../services/storage.service.js';
import { BadRequestError } from '../utilities/custom-errors.js';

const parseTxt = async (source) => {
  if (Buffer.isBuffer(source)) {
    return source.toString('utf8');
  }
  return fs.readFile(source, 'utf8');
};

const parseDocx = async (source) => {
  if (Buffer.isBuffer(source)) {
    const result = await mammoth.extractRawText({ buffer: source });
    return result.value;
  }
  const result = await mammoth.extractRawText({ path: source });
  return result.value;
};

const parsePdf = async (source) => {
  const buffer = Buffer.isBuffer(source) ? source : await fs.readFile(source);
  const result = await pdfParse(buffer);
  return result.text;
};

const parseDocumentFile = async (storageUrl, fileType) => {
  let source;

  if (storageUrl.startsWith('http://') || storageUrl.startsWith('https://')) {
    // S3 URL: download to buffer
    const url = new URL(storageUrl);
    const storageKey = decodeURIComponent(url.pathname.slice(1));
    source = await downloadFile(storageKey);
  } else {
    // Local path
    source = path.resolve(storageUrl);
  }

  if (fileType === 'txt') return parseTxt(source);
  if (fileType === 'docx') return parseDocx(source);
  if (fileType === 'pdf') return parsePdf(source);

  throw new BadRequestError(`Unsupported file type: ${fileType}`);
};

export { parseDocumentFile };
