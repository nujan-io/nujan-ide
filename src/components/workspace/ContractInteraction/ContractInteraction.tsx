import { UserContract } from '@/hooks/contract.hooks';
import {
  ABI,
  ContractLanguage,
  NetworkEnvironment,
} from '@/interfaces/workspace.interface';
import { SandboxContract } from '@ton/sandbox';
import FuncContractInteraction from './FuncContractInteraction';
import TactContractInteraction from './TactContractInteraction';

export interface ProjectInteractionProps {
  contractAddress: string;
  projectId: string;
  abi: ABI | null;
  network: NetworkEnvironment;
  contract: SandboxContract<UserContract> | null;
  language: ContractLanguage;
}

const ContractInteraction: React.FC<ProjectInteractionProps> = (props) => {
  if (props.language === 'func') {
    return <FuncContractInteraction {...props} />;
  } else {
    return <TactContractInteraction {...props} />;
  }
};

export default ContractInteraction;
