import { FileExtensionToFileType, FileType } from '@/enum/file';

export function fileTypeFromFileName(name: string): FileType {
  return fileTypeForExtension(name.split('.').pop() || '');
}

export function fileTypeForExtension(extension: string): any {
  return FileExtensionToFileType[extension as any] || FileType.Unknown;
}
