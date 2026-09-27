// Generated from the tested Wall1404 artifact.
// Do not edit manually.

export const WALL1404_BYTECODE =
  "0x6080604052348015600f57600080fd5b506103e08061001f6000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c80634730fa521461006757806365b41ee21461008c57806368775a2a14610095578063911a65121461009e578063acda0663146100b3578063ec52e060146100bb575b600080fd5b61007a610075366004610270565b6100ce565b60405190815260200160405180910390f35b61007a61046081565b61007a60005481565b6100b16100ac366004610299565b61010a565b005b61007a600381565b61007a6100c9366004610270565b610214565b6001600160a01b0381166000908152600160205260408120816100f46201518042610323565b8152602001908152602001600020549050919050565b80600081900361012d5760405163017636cb60e71b815260040160405180910390fd5b61046081111561015057604051636ceaf82160e01b815260040160405180910390fd5b600061015f6201518042610323565b3360009081526001602090815260408083208484529091529020549091506003811061019e5760405163f402e5b160e01b815260040160405180910390fd5b6101a9816001610345565b336000818152600160208181526040808420888552909152808320949094558154019081905591519091907f7086cea2f11dc2f73900fb4c1cf318bcc5b8773a2c115840a07c3551314cab34906102059089908990429061035e565b60405180910390a35050505050565b6001600160a01b038116600090815260016020526040812081908161023c6201518042610323565b81526020019081526020016000205490506003811061025e5750600092915050565b610269816003610397565b9392505050565b60006020828403121561028257600080fd5b81356001600160a01b038116811461026957600080fd5b600080602083850312156102ac57600080fd5b823567ffffffffffffffff8111156102c357600080fd5b8301601f810185136102d457600080fd5b803567ffffffffffffffff8111156102eb57600080fd5b8560208284010111156102fd57600080fd5b6020919091019590945092505050565b634e487b7160e01b600052601160045260246000fd5b60008261034057634e487b7160e01b600052601260045260246000fd5b500490565b808201808211156103585761035861030d565b92915050565b604081528260408201528284606083013760006060848301015260006060601f19601f8601168301019050826020830152949350505050565b818103818111156103585761035861030d56fea264697066735822122091ef1a734d0761567cd170b2a34c85c6c85e67be308d7f2821d53b5dec705f6d64736f6c634300081c0033";

export const WALL1404_ABI =
  [
  {
    "inputs": [],
    "name": "DailyLimitReached",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyMessage",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MessageTooLarge",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "author",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "message",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "Inscribed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_MESSAGES_PER_DAY",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_MESSAGE_BYTES",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "message",
        "type": "string"
      }
    ],
    "name": "inscribe",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "inscriptionCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "author",
        "type": "address"
      }
    ],
    "name": "postsToday",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "author",
        "type": "address"
      }
    ],
    "name": "remainingToday",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
