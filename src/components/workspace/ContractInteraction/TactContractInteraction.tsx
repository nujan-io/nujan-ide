import { TactType } from '@/interfaces/workspace.interface';
import { FC } from 'react';
import { TactABIUi } from '../ABIUi';
import { ProjectInteractionProps } from './ContractInteraction';
import s from './ContractInteraction.module.scss';

const TactContractInteraction: FC<ProjectInteractionProps> = ({
  contractAddress,
  abi,
  network,
  contract = null,
}) => {
  if (!contractAddress || !abi) {
    return <></>;
  }

  return (
    <div className={s.root}>
      <p>
        Below options will be used to call receiver and call getter method on
        contract after the contract is deployed.
      </p>
      <br />
      <h3 className={s.label}>Getters ({abi.getters.length})</h3>
      {abi.getters.length === 0 && <p>No Getters Found</p>}

      {abi.getters.map((getter) => (
        <TactABIUi
          key={getter.name}
          abiType={getter as TactType}
          contract={contract}
          contractAddress={contractAddress}
          network={network}
          type="Getter"
        />
      ))}
      <br />
      <h3 className={s.label}>Receivers ({abi.setters.length})</h3>
      {abi.setters.length === 0 && <p>No Receivers Found</p>}
      {abi.setters.map((setter) => (
        <TactABIUi
          key={setter.name}
          abiType={setter as TactType}
          contract={contract}
          contractAddress={contractAddress}
          network={network}
          type="Setter"
        />
      ))}
    </div>
  );
};

export default TactContractInteraction;
