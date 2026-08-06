import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

import { BadRequestError } from '../utilities/custom-errors.js';

const parseTxt = async (filePath) => fs.readFile(filePath, 'utf8');

const parseDocx = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

const parsePdf = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const result = await pdfParse(buffer);
  return result.text;
};

const parseDocumentFile = async (storageUrl, fileType) => {
  const filePath = path.resolve(storageUrl);

  if (fileType === 'txt') return parseTxt(filePath);
  if (fileType === 'docx') return parseDocx(filePath);
  if (fileType === 'pdf') return parsePdf(filePath);

  throw new BadRequestError(`Unsupported file type: ${fileType}`);
};

export { parseDocumentFile };
