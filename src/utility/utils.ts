import { FileExtensionToFileType, FileType } from '@/enum/file';
import { NetworkEnvironment } from '@/interfaces/workspace.interface';

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

export const objectToJSON = (obj: Object) => {
  let input: any = {};
  for (const [p, val] of Object.entries(obj)) {
    // convert all values to string. This would need to parse the json to string. Otherwise would fail for big number.
    input[p] = val.toString();
  }
  return input;
};

export const delay = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

type DebounceFn = (...args: any[]) => void;
export const debounce = <T extends DebounceFn>(callback: T, delay: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
};

export const getContractLINK = (
  contractAddress: string,
  chainNetwork: NetworkEnvironment
) => {
  if (chainNetwork === 'SANDBOX') {
    return '';
  }
  return `
  <a
    href="${getContractURL(contractAddress, chainNetwork)}"
    target="_blank"
  >
    View Deployed Contract
  </a>`;
};

export const getContractURL = (
  contractAddress: string,
  chainNetwork: NetworkEnvironment
) => {
  if (chainNetwork === 'SANDBOX') {
    return contractAddress;
  }
  return `https://${
    chainNetwork === 'TESTNET' ? 'testnet.' : ''
  }tonscan.org/address/${contractAddress}`;
};
