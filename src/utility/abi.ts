import { ContractLanguage } from '@/interfaces/workspace.interface';
import { CompilerContext } from '@tact-lang/compiler/dist/context';
import { getType } from '@tact-lang/compiler/dist/types/resolveDescriptors';
import {
  ABIArgument,
  ABIField,
  ABIType,
  ABITypeRef,
  ContractABI,
} from '@ton/core';
import { Maybe } from '@ton/core/dist/utils/maybe';

export type ABITypeObject = Record<string, ABIType>;

interface TactContractABI extends ContractABI {
  init: Maybe<ABIArgument[]>;
}

export interface TactABIField {
  name: string;
  type: ABITypeRef;
  fields: ABIField[] | null;
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

    return this.abi.receivers.map((receiver) => {
      let argumentName: string;

      switch (receiver.message.kind) {
        case 'typed':
          argumentName = receiver.message.type;
          break;
        case 'text':
          argumentName = receiver.message.text ?? '';
          break;
        case 'any':
          argumentName = 'null';
          break;
        case 'empty':
          argumentName = 'empty';
          break;
        default:
          argumentName = 'unknown';
          break;
      }

      return {
        name: receiver.receiver,
        params: [
          {
            name: argumentName,
            type: {
              kind: receiver.message.kind,
            },
            fields:
              receiver.message.kind === 'typed'
                ? this.resolveFields(receiver.message.type)
                : null,
          },
        ],
      };
    });
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
          optinal: item.type.optional,
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
