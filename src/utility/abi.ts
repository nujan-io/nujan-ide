import {
  ContractLanguage,
  TactABIField,
  TactInputFields,
} from '@/interfaces/workspace.interface';
import { CompilerContext } from '@tact-lang/compiler/dist/context';
import { getType } from '@tact-lang/compiler/dist/types/resolveDescriptors';
import {
  ABIArgument,
  ABIField,
  ABIType,
  Address,
  ContractABI,
} from '@ton/core';
import { Maybe } from '@ton/core/dist/utils/maybe';

export type ABITypeObject = Record<string, ABIType>;

interface TactContractABI extends ContractABI {
  init: Maybe<ABIArgument[]>;
}

export class ABIParser {
  private language: ContractLanguage;
  private abi: TactContractABI;
  private abiTypes: Maybe<ABITypeObject>;

  constructor(abi: TactContractABI, language: ContractLanguage = 'tact') {
    this.language = language;
    this.abi = abi;
    this.abiTypes = this.generateAbiTypes();
  }

  get init() {
    if (!this.abi.init) {
      return undefined;
    }
    return this.abi.init.map((item) => {
      const dataType = item.type.kind === 'simple' ? item.type.type : 'dict';
      if (
        this.abiTypes &&
        !Object.prototype.hasOwnProperty.call(this.abiTypes, dataType) &&
        item.type.kind === 'simple'
      ) {
        item.type.type = item.type.type.toLowerCase();
      }
      return {
        name: item.name,
        type: item.type,
        fields:
          item.type.kind === 'simple'
            ? this.resolveFields(item.type.type)
            : null,
      };
    });
  }

  get getters() {
    if (!this.abi.getters) {
      return undefined;
    }

    return this.abi.getters.map((getter) => {
      let getterArguments: TactABIField[] = [];
      if (getter.arguments) {
        getterArguments = getter.arguments.map((argument) => {
          return {
            name: argument.name,
            type: argument.type,
            fields:
              argument.type.kind === 'simple'
                ? this.resolveFields(argument.type.type)
                : null,
          };
        });
      }
      return {
        name: getter.name,
        params: getterArguments,
        returnType: getter.returnType,
      };
    });
  }

  get receivers() {
    if (!this.abi.receivers) {
      return undefined;
    }

    return (
      this.abi.receivers
        // TODO: handle fallback. i.e. kind === 'any'
        .filter(
          (item) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item.message as any).type !== 'Deploy' &&
            item.message.kind !== 'any',
        )
        .map((receiver) => {
          let argumentName: string;

          switch (receiver.message.kind) {
            case 'typed':
              argumentName = receiver.message.type;
              break;
            case 'text':
              argumentName = receiver.message.text ?? '';
              break;
            case 'any':
              argumentName = 'any';
              break;
            case 'empty':
              argumentName = 'empty';
              break;
            default:
              argumentName = 'unknown';
              break;
          }

          if (receiver.message.kind !== 'typed') {
            return {
              name: argumentName,
              type: {
                kind: 'simple',
                type: receiver.message.kind,
              },
              params: [
                {
                  name: argumentName,
                  type: {
                    kind: 'simple',
                    type: receiver.message.kind,
                    defaultValue: argumentName,
                  },
                },
              ],
            };
          }

          return {
            name: argumentName,
            params: [
              {
                name: argumentName,
                type: {
                  kind: 'simple',
                  type: argumentName,
                },
                fields: this.resolveFields(receiver.message.type),
              },
            ],
          };
        })
    );
  }

  getABI() {
    return this.abi;
  }

  private generateAbiTypes() {
    if (!this.abi.types || this.language === 'func') {
      return undefined;
    }
    return this.abi.types.reduce((acc, type) => {
      acc[type.name] = type;
      return acc;
    }, {} as ABITypeObject);
  }

  private resolveFields(field: string | null): ABIField[] | null {
    if (!field || !this.abiTypes) {
      return null;
    }
    if (!Object.prototype.hasOwnProperty.call(this.abiTypes, field)) {
      return null;
    }
    const type = this.abiTypes[field];
    return type.fields.map((item) => {
      return {
        name: item.name,
        type: item.type,
        fields:
          item.type.kind === 'simple'
            ? this.resolveFields(item.type.type)
            : null,
      };
    });
  }
}

export function getContractInitParams(
  ctx: CompilerContext,
  contractName: string,
) {
  const contactType = getType(ctx, contractName);

  if (!contactType.init?.args) return [];
  return contactType.init.args.map((item) => {
    let additionalProps = {};
    switch (item.type.kind) {
      case 'ref':
        additionalProps = {
          type: item.type.name,
          optional: item.type.optional,
        };
        break;
      case 'map':
        additionalProps = {
          key: item.type.value,
          type: undefined,
          value: item.type.value,
        };
        break;
      case 'void':
        additionalProps = {
          name: item.name,
          type: 'void',
        };
        break;
      case 'null':
        additionalProps = {
          name: item.name,
          type: 'null',
        };
        break;
      default:
        additionalProps = {
          name: 'unknown',
          type: 'null',
        };
        break;
    }
    return {
      name: item.name,
      type: {
        ...additionalProps,
        kind: item.type.kind === 'map' ? 'dict' : 'simple',
      },
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseInputs(inputFields: TactInputFields, key?: string): any {
  if (typeof inputFields === 'object' && !Array.isArray(inputFields)) {
    if ('value' in inputFields && 'type' in inputFields) {
      const value = inputFields['value'] as
        | string
        | undefined
        | number
        | boolean;
      if (value === undefined) return;
      const valueType = inputFields['type'] as string;

      switch (valueType) {
        case 'int':
        case 'uint':
          try {
            return BigInt(value);
          } catch (error) {
            throw new Error(`Parsing failed for ${key}: ${value}`);
          }
        case 'address':
          return Address.parse(value as string);
        case 'string':
          return String(value);
        case 'dict':
          throw new Error(`Map not supported yet`);
        case 'bool':
          return value;
        case 'text':
          return value;
        case 'empty':
          return null;
        default:
          throw new Error(`Unknown type: ${valueType}`);
      }
    } else {
      const parsedObj = {} as TactInputFields;
      if (
        typeof parsedObj === 'object' &&
        Object.prototype.hasOwnProperty.call(inputFields, '$$type')
      ) {
        parsedObj['$$type'] = inputFields['$$type'];
      }
      for (const key in inputFields as TactInputFields) {
        if (
          Object.prototype.hasOwnProperty.call(inputFields, key) &&
          !key.startsWith('$$')
        ) {
          parsedObj[key] = parseInputs(inputFields[key], key);
        }
      }
      return parsedObj;
    }
  } else if (Array.isArray(inputFields)) {
    return inputFields.map((item) => parseInputs(item));
  } else {
    return inputFields;
  }
}
