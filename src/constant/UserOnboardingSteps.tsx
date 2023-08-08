import { Placement } from 'react-joyride';

export const userOnboardingSteps = {
  styleConfiguration: {
    options: {
      arrowColor: '#b6c4b0',
      backgroundColor: '#b6c4b0',
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      primaryColor: '#000',
      textColor: '#000',
      zIndex: 1000000,
      width: 450,
    },
  },
  steps: [
    {
      target: '.onboarding-new-project',
      content: 'Create a new project',
      title: 'Welcome to Nujan',
      offset: -10,
      disableBeacon: true,
      afterEvent: 'ONBOARDOING_NEW_PROJECT',
    },
    {
      target: '.onboarding-new-project-form',
      disableBeacon: true,
      content: (
        <div>
          <p>1. What would you like to name your project?</p>
          <p>2. Choose a template or start from scratch</p>
        </div>
      ),
    },
    {
      target: '.onboarding-workspace-sidebar',
      disableBeacon: true,
      placement: 'right-start' as Placement,
      content: (
        <div>
          <p>
            <b>Home:</b> Return to the project listing screen.
          </p>
          <p>
            <b>Code:</b> You can start writing your smart contract from here.
          </p>
          <p>
            <b>Build & Deploy: </b> Build and deploy contract to Sandbox,
            Testnet, Mainnet
          </p>
        </div>
      ),
    },
    {
      target: '.onboarding-file-explorer',
      disableBeacon: true,
      placement: 'right-start' as Placement,
      title: 'File Explorer',
      content: (
        <div>
          <p>You can manage your files and folder here.</p>
          <p>
            <b>message.cell.ts:</b> Contains a cell which will be used for
            sending internal message to deployed contract.
          </p>
          <p>
            <b>main.fc:</b> It is a main contract file which will be compiled.
          </p>
          <p>
            <b>stateInit.cell.ts:</b> Contains a cell which will be used to
            deploy the contract. This will be initial state of the contract.
          </p>
          <p>
            <b>stdlib.fc:</b> This file is part of TON FunC Standard Library.
          </p>
        </div>
      ),
    },
    {
      target: '.onboarding-code-editor',
      title: 'Code Editor',
      content: 'Write your code here',
      disableBeacon: true,
      name: 'codeEditor',
    },
    {
      target: '.onboarding-build-deploy',
      title: 'Build & Deploy',
      content: (
        <div>
          <p>
            <b>Sandbox:</b> It is a local TON network. Allows you to emulate TON
            smart contracts, send messages to them and run get methods on them
            as if they were deployed on a real network.
          </p>
          <p>
            <b>Testnet:</b> It is network to test your contract before deploying
            to main network. To deploy on it you can use test TON coin.
          </p>
          <p>
            <b>Mainnet:</b> It allows you to deploy you contract on mainnet. You
            need to have real TON coin to deploy on it.
          </p>
        </div>
      ),
      disableBeacon: true,
      name: 'buildDeploy',
      placement: 'right-start' as Placement,
    },
  ],
};
