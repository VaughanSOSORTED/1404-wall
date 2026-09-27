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
