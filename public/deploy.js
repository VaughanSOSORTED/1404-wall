import {
  WALL1404_BYTECODE
} from './wall1404-artifact.js';

const EXPECTED_CHAIN_ID = 1404;
const EXPECTED_CHAIN_HEX = '0x57c';
const DEPLOYMENT_GAS_LIMIT = 325000n;
const DEPLOYMENT_GAS_PRICE = 4000028n;

const walletEl =
  document.querySelector('#wallet');

const chainEl =
  document.querySelector('#chain');

const networkEl =
  document.querySelector('#network');

const balanceEl =
  document.querySelector('#balance');

const bytecodeEl =
  document.querySelector('#bytecode');

const gasEl =
  document.querySelector('#gas');

const costEl =
  document.querySelector('#cost');

const connectButton =
  document.querySelector('#connect');

const deployButton =
  document.querySelector('#deploy');

const acknowledge =
  document.querySelector('#acknowledge');

const result =
  document.querySelector('#result');

let account = null;
let estimatedGas = null;
let gasPrice = null;

const byteLength =
  (WALL1404_BYTECODE.length - 2) / 2;

bytecodeEl.textContent =
  `${byteLength.toLocaleString()} bytes`;

function setResult(message, type = '') {
  result.textContent = message;
  result.className =
    `deploy-result ${type}`;
}

function formatBDAG(wei) {
  const value = BigInt(wei);

  const whole =
    value / 1000000000000000000n;

  const fraction =
    (
      value %
      1000000000000000000n
    )
      .toString()
      .padStart(18, '0')
      .replace(/0+$/, '');

  return fraction
    ? `${whole}.${fraction}`
    : whole.toString();
}

async function request(method, params = []) {
  return window.ethereum.request({
    method,
    params
  });
}

async function refreshWallet() {

  if (!window.ethereum) {
    setResult(
      'No browser wallet was detected. Open this page in the browser profile containing MetaMask.',
      'fail'
    );
    return;
  }

  const accounts =
    await request('eth_accounts');

  if (!accounts.length) {
    account = null;

    walletEl.textContent =
      'NOT CONNECTED';

    acknowledge.disabled = true;
    deployButton.disabled = true;

    return;
  }

  account = accounts[0];

  walletEl.textContent = account;

  const chainHex =
    await request('eth_chainId');

  const chainId =
    Number.parseInt(chainHex, 16);

  chainEl.textContent =
    `${chainId} (${chainHex})`;

  if (chainId !== EXPECTED_CHAIN_ID) {

    networkEl.textContent =
      'WRONG NETWORK';

    networkEl.className =
      'fail';

    acknowledge.disabled = true;
    deployButton.disabled = true;

    setResult(
      `Wrong network. Expected Chain 1404 (${EXPECTED_CHAIN_HEX}). No deployment is allowed.`,
      'fail'
    );

    return;
  }

  networkEl.textContent =
    'BLOCKDAG CHAIN 1404';

  networkEl.className =
    'pass';

  const balance =
    await request(
      'eth_getBalance',
      [account, 'latest']
    );

  balanceEl.textContent =
    `${formatBDAG(balance)} BDAG`;

  try {

    const estimate =
      await request(
        'eth_estimateGas',
        [{
          from: account,
          data: WALL1404_BYTECODE
        }]
      );

    estimatedGas =
      BigInt(estimate);

    gasEl.textContent =
      estimatedGas.toString();

  } catch (error) {

    estimatedGas = null;

    gasEl.textContent =
      'ESTIMATE FAILED';

    acknowledge.disabled = true;
    deployButton.disabled = true;

    setResult(
      `Deployment simulation failed: ${error.message}`,
      'fail'
    );

    return;
  }

  try {

    gasPrice =
      DEPLOYMENT_GAS_PRICE;

    const maximumCost =
      DEPLOYMENT_GAS_LIMIT *
      DEPLOYMENT_GAS_PRICE;

    costEl.textContent =
      `${formatBDAG(maximumCost)} BDAG maximum`;

  } catch {

    gasPrice = null;

    costEl.textContent =
      'Wallet will calculate fee';

  }

  acknowledge.disabled = false;

  setResult(
    'Wallet and Chain 1404 checks passed. Review everything above before acknowledging deployment.',
    'pass'
  );

  updateDeployButton();
}

function updateDeployButton() {

  deployButton.disabled =
    !account ||
    !estimatedGas ||
    !acknowledge.checked;
}

connectButton.addEventListener(
  'click',
  async () => {

    try {

      if (!window.ethereum) {

        setResult(
          'MetaMask or another compatible browser wallet was not detected.',
          'fail'
        );

        return;
      }

      await request(
        'eth_requestAccounts'
      );

      await refreshWallet();

    } catch (error) {

      setResult(
        `Wallet connection cancelled or failed: ${error.message}`,
        'fail'
      );
    }
  }
);

acknowledge.addEventListener(
  'change',
  updateDeployButton
);

deployButton.addEventListener(
  'click',
  async () => {

    if (
      !account ||
      !estimatedGas ||
      !acknowledge.checked
    ) {
      return;
    }

    const chainHex =
      await request('eth_chainId');

    if (
      Number.parseInt(chainHex, 16) !==
      EXPECTED_CHAIN_ID
    ) {

      setResult(
        'Network changed. Deployment cancelled.',
        'fail'
      );

      return;
    }

    const confirmed =
      window.confirm(
        'FINAL CONFIRMATION\n\n' +
        'You are about to ask your wallet to deploy the tested Wall1404 contract to BlockDAG Chain 1404.\n\n' +
        'This is a real blockchain transaction and will spend BDAG gas.\n\n' +
        'Continue to wallet confirmation?'
      );

    if (!confirmed) {
      return;
    }

    deployButton.disabled = true;

    setResult(
      'Opening wallet confirmation. Nothing is final until you approve the transaction in your wallet.'
    );

    try {

      /*
       * 325,000 provides headroom over the
       * independently verified 270,623 estimate.
       */
      const txHash =
        await request(
          'eth_sendTransaction',
          [{
            from: account,
            data: WALL1404_BYTECODE,
            gas: '0x4f588',
            gasPrice: '0x3d091c'
          }]
        );

      setResult(
        `Deployment transaction submitted: ${txHash}`,
        'pass'
      );

      deployButton.textContent =
        'TRANSACTION SUBMITTED';

    } catch (error) {

      deployButton.disabled = false;

      setResult(
        `Deployment was not submitted: ${error.message}`,
        'fail'
      );
    }
  }
);

if (window.ethereum) {

  window.ethereum.on(
    'accountsChanged',
    () => {
      acknowledge.checked = false;
      refreshWallet().catch(console.error);
    }
  );

  window.ethereum.on(
    'chainChanged',
    () => {
      acknowledge.checked = false;
      refreshWallet().catch(console.error);
    }
  );

  refreshWallet().catch(console.error);
}
