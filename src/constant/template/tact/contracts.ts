export const TactBlankContract = {
  code: `import "@stdlib/deploy";

contract BlankContract with Deployable {
    init() {
        
    }
}
`,
};

export const TactCounterContract = {
  code: `import "@stdlib/deploy";

message Add {
    queryId: Int as uint64;
    amount: Int as uint32;
}

contract TactCounter with Deployable {
    id: Int as uint32;
    counter: Int as uint32;

    init(id: Int) {
        self.id = id;
        self.counter = 0;
    }

    receive(msg: Add) {
        self.counter += msg.amount;
    }

    get fun counter(): Int {
        return self.counter;
    }

    get fun id(): Int {
        return self.id;
    }
}
`,
};
