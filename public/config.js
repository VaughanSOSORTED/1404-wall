// The 1404 Wall — verified mainnet configuration.
// Contract independently verified on Chain 1404 before frontend integration.

export const chain = Object.freeze({
  chainId: 1404,
  chainIdHex: '0x57c',
  chainName: 'BlockDAG Chain 1404',

  contractAddress:
    '0x552ea0d1f40e11ece1a7ea742eea9010092de024',

  rpcUrls: Object.freeze([
    'https://rpc.capedag.com',
    'https://rpc.dvdmining.com',
    'https://rpc.east.bdag-us.org',
    'https://rpc.west.bdag-us.org',
    'https://rpc.dagcore.net',
    'https://rpc.bdagexplorer.com',
    'https://rpc.cms-mining-pool.net'
  ]),

  explorerUrl:
    'https://bdagexplorer.com',

  nativeCurrency: Object.freeze({
    name: 'BDAG',
    symbol: 'BDAG',
    decimals: 18
  })
});

// Remains true until the live frontend integration itself
// has been separately tested and enabled.
export const DEMO_MODE = true;
