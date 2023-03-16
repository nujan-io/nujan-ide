const contractTsSample = `(int) load_data() inline {                 ;; read function declaration - returns int as result
  var ds = get_data().begin_parse();       ;; load the storage cell and start parsing as a slice
  return (ds~load_uint(64));               ;; read a 64 bit unsigned int from the slice and return it
}

() save_data(int counter) impure inline {  ;; write function declaration - takes an int as arg
  set_data(begin_cell()                    ;; store the storage cell and create it with a builder 
    .store_uint(counter, 64)               ;; write a 64 bit unsigned int to the builder
    .end_cell());                          ;; convert the builder to a cell
}

() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {  ;; well known function signature
  if (in_msg_body.slice_empty?()) {         ;; check if incoming message is empty (with no body)
    return ();                              ;; return successfully and accept an empty message
  }
  int op = in_msg_body~load_uint(32);                                     ;; parse the operation type encoded in the beginning of msg body
  var (counter) = load_data();                                            ;; call our read utility function to load values from storage
  if (op == 1) {                                                          ;; handle op #1 = increment
    save_data(counter + 1);                                               ;; call our write utility function to persist values to storage
  }
}

int counter() method_id {        ;; getter declaration - returns int as result
  var (counter) = load_data();   ;; call our read utility function to load value
  return counter;
}
`;

const contractSampleBlank = `() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {

}`;

const contractChatBot = `;; Credit: https://github.com/LaDoger/doge.fc

() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {
  ;; if you send over 0.0069 TON to this contract, it will reply you "doge"!

  ;; ignore the sender if they send in less than 0.0069 TON
  ;; because this smart contract needs to pay for the gas fee
  ;; to send the reply message
  if (msg_value < 6900000) { ;; 6900000 nanoton == 0.0069 TON
    return ();
  }

  ;; parse the in_msg cell to get the info we want
  slice cs = in_msg.begin_parse(); ;; turn in_msg into a slice
  int flags = cs~load_uint(4); ;; load the flags. we don't need this tho
  slice sender_address = cs~load_msg_addr(); ;; load the sender address

  slice doge = "doge"; ;; "doge" will be our reply comment

  ;; build the message cell that we want this contract to send back
  ;; see https://ton.org/docs/develop/smart-contracts/messages
  cell msg = begin_cell()
      .store_uint(0x18, 6)
      .store_slice(sender_address) ;; reply back to the original sender
      .store_coins(69) ;; send 69 nanoton so it's not a zero-value transaction which wallets may ignore 
      .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
      .store_uint(0, 32) ;; call op == 0 because we are not calling an op
      .store_slice(doge) ;; store "doge" as a comment
  .end_cell();

  ;; send the message https://ton.org/docs/develop/func/stdlib/#send_raw_message
  send_raw_message(msg, 3); ;; i was told that mode 64 is a better practice now, so (msg, 64)
}`;

const testCaseCounter = `// CONTRACT_BOC will be automatically updated with the build output at run time
const {
	core: { describe, it, expect, run, beforeEach },
	prettify,
} = window.jestLite;
const Sandbox = window.Sandbox;
const { Blockchain } = Sandbox;
const TonCore = window.TonCore;
const { beginCell, contractAddress, toNano } = TonCore;
const Buffer = window.Buffer;

class Counter {
	address;
	init;
	static createForDeploy(code, initialCounterValue) {
		const data = beginCell().storeUint(initialCounterValue, 64).endCell();
		const workchain = 0;
		const address = contractAddress(workchain, { code, data });
		return new Counter(address, { code, data });
	}

	constructor(address, init) {
		this.address = address;
		this.init = init;
	}

	async sendDeploy(provider, via) {
		await provider.internal(via, {
			value: "0.01", // send 0.01 TON to contract for rent
			bounce: false,
		});
	}

	async getCounter(provider) {
		const { stack } = await provider.get("counter", []);
		return stack.readBigNumber();
	}

	async sendIncrement(provider, via) {
		const messageBody = TonCore.beginCell()
			.storeUint(1, 32) // op (op #1 = increment)
			.storeUint(0, 64) // query id
			.endCell();
		await provider.internal(via, {
			value: "0.002", // send 0.002 TON for gas
			body: messageBody,
		});
	}
}

describe("Counter tests", async () => {
	let blockchain;
	let wallet1;
	let counterContract;

	beforeEach(async () => {
		const counterCode = TonCore.Cell.fromBoc(
			Buffer.from(
				"{CONTRACT_BOC}",
				"base64"
			)
		)[0];
		const initialCounterValue = 20;
		const counter = Counter.createForDeploy(counterCode, initialCounterValue);

		blockchain = await Blockchain.create();
		wallet1 = await blockchain.treasury("user1");
		// deploy counter
		counterContract = blockchain.openContract(counter);
		await counterContract.sendDeploy(wallet1.getSender());
	});

	it("should get counter value", async () => {
		const value = await counterContract.getCounter();
		expect(value).toEqual(20n);
	});

	it("should increment the counter value", async () => {
		await counterContract.sendIncrement(wallet1.getSender());
		const counterValue = await counterContract.getCounter();
		expect(counterValue).toEqual(21n);
	});

	it("should send ton coin to the contract", async () => {
		console.log("sending 7.123 TON");
		await wallet1.send({
			to: counterContract.address,
			value: toNano("7.123"),
		});
	});
});
`;

export const ProjectTemplate = {
  tonBlank: {
    func: [
      {
        id: '1',
        name: 'main.fc',
        parent: null,
        type: 'file' as const,
        path: 'main.fc',
        content: contractSampleBlank,
      },
      {
        id: '2',
        name: 'stateInit.cell.js',
        parent: null,
        type: 'file' as const,
        path: 'stateInit.cell.js',
        content: `let cell = new tonweb.boc.Cell;
cell.bits.writeUint(34, 64);`,
        disableActions: true,
      },
      {
        id: '3',
        name: 'contract.cell.js',
        parent: null,
        type: 'file' as const,
        path: 'contract.cell.js',
        content: `let cell = new tonweb.boc.Cell;
cell.bits.writeUint(1, 32);
cell.bits.writeUint(0, 64);`,
        disableActions: true,
      },
      {
        id: '4',
        name: 'test.spec.js',
        parent: null,
        type: 'file' as const,
        path: 'test.spec.js',
        content: testCaseCounter,
        disableActions: true,
      },
    ],
  },
  tonCounter: {
    func: [
      {
        id: '1',
        name: 'main.fc',
        parent: null,
        type: 'file' as const,
        path: 'main.fc',
        content: contractTsSample,
      },
      {
        id: '2',
        name: 'stateInit.cell.js',
        parent: null,
        type: 'file' as const,
        path: 'stateInit.cell.js',
        content: `let cell = new tonweb.boc.Cell;
cell.bits.writeUint(34, 64);`,
        disableActions: true,
      },
      {
        id: '3',
        name: 'contract.cell.js',
        parent: null,
        type: 'file' as const,
        path: 'contract.cell.js',
        content: `let cell = new tonweb.boc.Cell;
cell.bits.writeUint(1, 32);
cell.bits.writeUint(0, 64);`,
        disableActions: true,
      },
      {
        id: '4',
        name: 'test.spec.js',
        parent: null,
        type: 'file' as const,
        path: 'test.spec.js',
        content: testCaseCounter,
        disableActions: true,
      },
    ],
  },
  chatBot: {
    func: [
      {
        id: '1',
        name: 'main.fc',
        parent: null,
        type: 'file' as const,
        path: 'main.fc',
        content: contractChatBot,
      },
      {
        id: '2',
        name: 'stateInit.cell.js',
        parent: null,
        type: 'file' as const,
        path: 'stateInit.cell.js',
        content: `let cell = new tonweb.boc.Cell;
cell.bits.writeUint(34, 64);`,
        disableActions: true,
      },
      {
        id: '3',
        name: 'contract.cell.js',
        parent: null,
        type: 'file' as const,
        path: 'contract.cell.js',
        content: `let cell = new tonweb.boc.Cell;
cell.bits.writeUint(1, 32);
cell.bits.writeUint(0, 64);`,
        disableActions: true,
      },
      {
        id: '4',
        name: 'test.spec.js',
        parent: null,
        type: 'file' as const,
        path: 'test.spec.js',
        content: testCaseCounter,
        disableActions: true,
      },
    ],
  },
};
