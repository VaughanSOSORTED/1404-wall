// Generated from verified Wall1404 function signatures.
// Read-only Chain 1404 integration.

import { chain } from './config.js';

const RPC_TIMEOUT_MS = 8000;

const SELECTORS = Object.freeze(
  {
  "inscriptionCount": "0x68775a2a",
  "maxMessages": "0xacda0663",
  "maxBytes": "0x65b41ee2",
  "remainingToday": "0xec52e060"
}
);

let preferredRpcIndex = 0;

function decodeQuantity(value) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('0x')
  ) {
    throw new Error('Invalid RPC quantity');
  }

  return BigInt(value);
}

async function rpcRequest(
  url,
  method,
  params = []
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      RPC_TIMEOUT_MS
    );

  try {
    const response =
      await fetch(url, {
        method: 'POST',
        headers: {
          'content-type':
            'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params
        }),
        signal: controller.signal
      });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const payload =
      await response.json();

    if (payload.error) {
      throw new Error(
        payload.error.message ||
        `RPC error ${payload.error.code}`
      );
    }

    return payload.result;

  } finally {
    clearTimeout(timer);
  }
}

export async function rpcWithFallback(
  method,
  params = []
) {
  if (!chain.rpcUrls?.length) {
    throw new Error(
      'No Chain 1404 RPC endpoints configured'
    );
  }

  let lastError = null;

  for (
    let offset = 0;
    offset < chain.rpcUrls.length;
    offset++
  ) {
    const index =
      (
        preferredRpcIndex +
        offset
      ) % chain.rpcUrls.length;

    const url =
      chain.rpcUrls[index];

    try {
      const result =
        await rpcRequest(
          url,
          method,
          params
        );

      preferredRpcIndex = index;

      return {
        result,
        rpc: url
      };

    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    'All configured Chain 1404 RPCs failed: ' +
    (
      lastError?.message ||
      'unknown error'
    )
  );
}

async function contractCall(data) {
  return rpcWithFallback(
    'eth_call',
    [{
      to: chain.contractAddress,
      data
    }, 'latest']
  );
}

function encodeAddress(address) {
  if (
    typeof address !== 'string' ||
    !/^0x[a-fA-F0-9]{40}$/.test(address)
  ) {
    throw new Error(
      'Invalid wallet address'
    );
  }

  return address
    .slice(2)
    .toLowerCase()
    .padStart(64, '0');
}

export async function getChainId() {
  const response =
    await rpcWithFallback(
      'eth_chainId'
    );

  return {
    value:
      decodeQuantity(response.result),
    rpc: response.rpc
  };
}

export async function getBlockNumber() {
  const response =
    await rpcWithFallback(
      'eth_blockNumber'
    );

  return {
    value:
      decodeQuantity(response.result),
    rpc: response.rpc
  };
}

export async function getInscriptionCount() {
  const response =
    await contractCall(
      SELECTORS.inscriptionCount
    );

  return {
    value:
      decodeQuantity(response.result),
    rpc: response.rpc
  };
}

export async function getMaxMessagesPerDay() {
  const response =
    await contractCall(
      SELECTORS.maxMessages
    );

  return {
    value:
      decodeQuantity(response.result),
    rpc: response.rpc
  };
}

export async function getMaxMessageBytes() {
  const response =
    await contractCall(
      SELECTORS.maxBytes
    );

  return {
    value:
      decodeQuantity(response.result),
    rpc: response.rpc
  };
}

export async function getRemainingToday(
  address
) {
  const data =
    SELECTORS.remainingToday +
    encodeAddress(address);

  const response =
    await contractCall(data);

  return {
    value:
      decodeQuantity(response.result),
    rpc: response.rpc
  };
}

export async function getWallSummary(
  address = null
) {
  const chainId =
    await getChainId();

  if (
    chainId.value !==
    BigInt(chain.chainId)
  ) {
    throw new Error(
      `RPC returned unexpected chain ID ${chainId.value}`
    );
  }

  const [
    block,
    count,
    maxMessages,
    maxBytes
  ] = await Promise.all([
    getBlockNumber(),
    getInscriptionCount(),
    getMaxMessagesPerDay(),
    getMaxMessageBytes()
  ]);

  let remaining = null;

  if (address) {
    remaining =
      await getRemainingToday(address);
  }

  return Object.freeze({
    chainId: chainId.value,
    blockNumber: block.value,
    inscriptionCount: count.value,
    maxMessagesPerDay:
      maxMessages.value,
    maxMessageBytes:
      maxBytes.value,
    remainingToday:
      remaining?.value ?? null,
    rpc:
      remaining?.rpc ||
      count.rpc ||
      chainId.rpc
  });
}

const WALL_DEPLOYMENT_BLOCK = 22626656n;

// keccak256("Inscribed(uint256,address,string,uint256)")
const INSCRIBED_TOPIC =
  '0x7086cea2f11dc2f73900fb4c1cf318bcc5b8773a2c115840a07c3551314cab34';

function hexBlock(value){
  return '0x' + BigInt(value).toString(16);
}

function hexToBytes(hex){
  const clean=hex.startsWith('0x')
    ? hex.slice(2)
    : hex;

  if(clean.length % 2 !== 0){
    throw new Error('Invalid hex data');
  }

  const bytes=
    new Uint8Array(clean.length / 2);

  for(let i=0;i<bytes.length;i++){
    bytes[i]=
      parseInt(clean.slice(i*2,i*2+2),16);
  }

  return bytes;
}

function readWord(hex,wordIndex){
  const clean=
    hex.startsWith('0x')
      ? hex.slice(2)
      : hex;

  const start=wordIndex*64;
  const word=clean.slice(start,start+64);

  if(word.length !== 64){
    throw new Error(
      'Invalid ABI word'
    );
  }

  return BigInt('0x'+word);
}

function decodeAbiString(data){
  const clean=
    data.startsWith('0x')
      ? data.slice(2)
      : data;

  const offset=
    Number(readWord(clean,0));

  const lengthWordIndex=
    offset / 32;

  const length=
    Number(
      readWord(
        clean,
        lengthWordIndex
      )
    );

  const stringStart=
    (lengthWordIndex + 1) * 64;

  const stringHex=
    clean.slice(
      stringStart,
      stringStart + length*2
    );

  return new TextDecoder(
    'utf-8',
    {fatal:true}
  ).decode(
    hexToBytes(stringHex)
  );
}

function topicAddress(topic){
  if(
    typeof topic !== 'string' ||
    topic.length !== 66
  ){
    throw new Error(
      'Invalid indexed address topic'
    );
  }

  return '0x' + topic.slice(-40);
}

function decodeInscribedLog(log){
  if(
    !Array.isArray(log.topics) ||
    log.topics.length < 3
  ){
    throw new Error(
      'Invalid Inscribed event'
    );
  }

  const id=
    BigInt(log.topics[1]);

  const author=
    topicAddress(log.topics[2]);

  const message=
    decodeAbiString(log.data);

  const clean=
    log.data.startsWith('0x')
      ? log.data.slice(2)
      : log.data;

  const timestamp=
    readWord(clean,2);

  return Object.freeze({
    id,
    author,
    message,
    timestamp,
    blockNumber:
      BigInt(log.blockNumber),
    transactionHash:
      log.transactionHash
  });
}

async function getInscribedTopic(){
  // eth_getLogs needs the Keccak-256 event topic.
  // Ask the connected browser/runtime for the exact value
  // through a locally known constant generated below.
  return INSCRIBED_TOPIC;
}

export async function getInscriptionLogs(
  fromBlock=WALL_DEPLOYMENT_BLOCK,
  toBlock='latest'
){
  const topic=
    await getInscribedTopic();

  if(!/^0x[a-fA-F0-9]{64}$/.test(topic)){
    throw new Error(
      'Inscribed event topic has not been generated'
    );
  }

  const response=
    await rpcWithFallback(
      'eth_getLogs',
      [{
        address:chain.contractAddress,
        fromBlock:hexBlock(fromBlock),
        toBlock:
          toBlock === 'latest'
            ? 'latest'
            : hexBlock(toBlock),
        topics:[topic]
      }]
    );

  const logs=
    Array.isArray(response.result)
      ? response.result
      : [];

  return {
    entries:
      logs
        .map(decodeInscribedLog)
        .sort(
          (a,b)=>
            a.id > b.id ? -1 :
            a.id < b.id ? 1 : 0
        ),
    rpc:response.rpc
  };
}

export {
  WALL_DEPLOYMENT_BLOCK
};
