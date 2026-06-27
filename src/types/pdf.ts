/**
 * Core types shared between frontend and Tauri commands.
 * These types are used to define the structure of data exchanged between the frontend and the backend of the application.
*/

export interface DocumentInfo {
  path: string
  pageCount: number
  title: string | null
  author: string | null
  subject: string | null
  creator: string | null
  producer: string | null
  creationDate: string | null
  modDate: string | null
  pdfVersion: string
  pageWidthPt: number
  pageHeightPt: number
  isEncrypted: boolean
};

export interface PageRenderRequest {
  path: string
  page: number
  zoom: number
};

export interface PageRenderResult {
  imageBase64: string
  widthPx: number
  heightPx: number
};

export interface SecurityInfo {
  isEncrypted: boolean
  encryptionMethod: string | null
  keyLengthBits: number | null
  canPrint: boolean
  canPrintHighRes: boolean
  canModify: boolean
  canCopy: boolean
  canAnnotate: boolean
  canFillForms: boolean
  canExtractForAccessibility: boolean
  canAssemble: boolean
};

export type PdfErrorKind =
  | 'FileNotFound'
  | 'WrongPassword'
  | 'PasswordRequired'
  | 'InvalidPdf'
  | 'NotEncrypted'
  | 'AlreadyEncrypted'
  | 'RenderError'
  | 'Unknown';

export interface PdfError {
  kind: PdfErrorKind
  message: string
};

export type Theme = 'light' | 'dark' | 'system';
export type SupportedLocale = 'it' | 'en' | 'fr' | 'de';