import { FileExtensionToFileType, FileType } from '@/enum/file';

export function fileTypeFromFileName(name: string): FileType {
  return fileTypeForExtension(name.split('.').pop() || '');
}

export function fileTypeForExtension(extension: string): any {
  return FileExtensionToFileType[extension as any] || FileType.Unknown;
}

export const isWebAssemblySupported = () => {
  return (() => {
    try {
      if (
        typeof WebAssembly === 'object' &&
        typeof WebAssembly.instantiate === 'function'
      ) {
        const assemblyModule = new WebAssembly.Module(
          Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
        );
        if (assemblyModule instanceof WebAssembly.Module)
          return (
            new WebAssembly.Instance(assemblyModule) instanceof
            WebAssembly.Instance
          );
      }
    } catch (e) {}
    return false;
  })();
};

export const encodeBase64 = (data: string) => {
  return Buffer.from(data).toString('base64');
};
export const decodeBase64 = (data: string) => {
  return Buffer.from(data, 'base64').toString('ascii');
};
