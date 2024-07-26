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

      <TactABIUi
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        abi={abi.getters as any}
        contract={contract}
        contractAddress={contractAddress}
        network={network}
        type="Getter"
      />
      <br />
      <h3 className={s.label}>Receivers ({abi.setters.length})</h3>
      {abi.setters.length === 0 && <p>No Receivers Found</p>}
      <TactABIUi
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        abi={abi.setters as any}
        contract={contract}
        contractAddress={contractAddress}
        network={network}
        type="Setter"
      />
    </div>
  );
};

export default TactContractInteraction;
