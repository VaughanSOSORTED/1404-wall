import {chain, DEMO_MODE} from './config.js';
import {
  moderateMessage,
  MODERATION_NOTICE
} from './moderation.js';
import {
  getWallSummary,
  getRemainingToday,
  getInscriptionLogs
} from './live-chain.js';
const $ = s => document.querySelector(s);
let filter='latest', shown=5, wallet=null, network=null;
let liveSummary=null;
let liveReadError=null;
let transactionPending=false;

const INSCRIBE_SELECTOR='0x911a6512';
const MAX_MESSAGE_CHARACTERS=280;
const MAX_MESSAGE_BYTES=1120;

function shortAddress(a){return `${a.slice(0,6)}…${a.slice(-4)}`;}

function setLiveStatus(message, state='loading'){
  const element=$('#liveChainStatus');
  if(!element)return;
  element.textContent=message;
  element.dataset.state=state;
}

function renderLiveSummary(){
  if(!liveSummary)return;

  const count=$('#liveInscriptionCount');
  const block=$('#liveBlockNumber');
  const contract=$('#liveContractStatus');

  if(count){
    count.textContent=
      liveSummary.inscriptionCount.toString();
  }

  if(block){
    block.textContent=
      liveSummary.blockNumber.toString();
  }

  if(contract){
    contract.textContent='VERIFIED · CHAIN 1404';
  }
}

async function refreshLiveChain(){
  setLiveStatus(
    'READING LIVE CHAIN 1404 DATA…',
    'loading'
  );

  try{
    liveSummary=await getWallSummary();
    liveReadError=null;

    renderLiveSummary();

    setLiveStatus(
      'LIVE · CHAIN 1404',
      'live'
    );

    if(wallet){
      await refreshAllowance();
    }

  }catch(error){
    console.error(
      'Live Chain 1404 read failed:',
      error
    );

    liveReadError=error;

    setLiveStatus(
      'LIVE CHAIN DATA TEMPORARILY UNAVAILABLE',
      'error'
    );
  }
}

async function refreshAllowance(){
  if(!wallet){
    $('#dailyRemaining').textContent=
      'CONNECT WALLET TO CHECK';
    return;
  }

  if(
    network?.toLowerCase() !==
    chain.chainIdHex
  ){
    $('#dailyRemaining').textContent=
      'SWITCH TO CHAIN 1404';
    return;
  }

  $('#dailyRemaining').textContent=
    'CHECKING…';

  try{
    const result=
      await getRemainingToday(wallet);

    $('#dailyRemaining').textContent=
      `${result.value.toString()} OF 3 REMAINING`;

  }catch(error){
    console.error(
      'Allowance read failed:',
      error
    );

    $('#dailyRemaining').textContent=
      'UNAVAILABLE';
  }
}
let inscriptions=[];
let feedLoading=true;
let feedError=null;

function visibleEntries(){
  let entries=inscriptions;

  if(filter==='mine'){
    if(!wallet)return [];

    entries=entries.filter(
      entry=>
        entry.author.toLowerCase() ===
        wallet.toLowerCase()
    );
  }

  if(filter==='latest'){
    return entries.slice(0,5);
  }

  return entries.slice(0,shown);
}

function formatTimestamp(value){
  const milliseconds=
    Number(value)*1000;

  if(!Number.isSafeInteger(milliseconds)){
    return 'ON-CHAIN';
  }

  return new Date(
    milliseconds
  ).toLocaleString();
}

function render(){
  const cards=$('#cards');
  cards.replaceChildren();

  if(feedLoading){
    const loading=
      document.createElement('p');

    loading.className='empty';
    loading.textContent=
      'Reading inscriptions from Chain 1404…';

    cards.append(loading);

    $('#resultCount').textContent=
      'Loading blockchain inscriptions';

    $('#loadMore').hidden=true;
    return;
  }

  if(feedError){
    const error=
      document.createElement('p');

    error.className='empty';
    error.textContent=
      'The blockchain feed is temporarily unavailable. Please try again shortly.';

    cards.append(error);

    $('#resultCount').textContent=
      'Blockchain feed unavailable';

    $('#loadMore').hidden=true;
    return;
  }

  const entries=visibleEntries();

  entries.forEach(entry=>{
    const row=
      document.createElement('article');

    row.className='message-row';

    const id=
      document.createElement('span');

    id.className='message-id';
    id.textContent=
      `#${entry.id.toString().padStart(6,'0')}`;

    const body=
      document.createElement('div');

    body.className='message-body';

    const moderation=
      moderateMessage(entry.message);

    if(moderation.hidden){
      row.classList.add('filtered');
    }

    const quote=
      document.createElement('strong');

    quote.textContent=
      moderation.hidden
        ? MODERATION_NOTICE
        : `“${entry.message}”`;

    const note=
      document.createElement('small');

    note.textContent=
      `${shortAddress(entry.author)} · ${formatTimestamp(entry.timestamp)} · BLOCK ${entry.blockNumber}`;

    body.append(quote,note);

    const tag=
      document.createElement('span');

    tag.className='message-tag';

    tag.textContent=
      moderation.hidden
        ? 'FILTERED'
        : 'ON-CHAIN';

    row.append(
      id,
      body,
      tag
    );

    cards.append(row);
  });

  if(!entries.length){
    const empty=
      document.createElement('p');

    empty.className='empty';

    if(filter==='mine'){
      empty.textContent=
        wallet
          ? 'No inscriptions from this wallet yet.'
          : 'Connect your wallet to view your inscriptions.';
    }else{
      empty.textContent=
        'No inscriptions yet. The 1404 Wall is ready for its first permanent message.';
    }

    cards.append(empty);
  }

  $('#resultCount').textContent=
    `${entries.length} on-chain inscription${entries.length===1?'':'s'}`;

  $('#loadMore').hidden=
    filter!=='all' ||
    shown>=inscriptions.length;
}

async function refreshFeed(){
  feedLoading=
    inscriptions.length===0;

  if(feedLoading)render();

  try{
    const result=
      await getInscriptionLogs();

    inscriptions=result.entries;
    feedError=null;

  }catch(error){
    console.error(
      'Inscription feed read failed:',
      error
    );

    feedError=error;

  }finally{
    feedLoading=false;
    render();
  }
}
refreshFeed();
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;shown=5;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===button));render();}));
$('#loadMore').addEventListener('click',()=>{shown+=5;render();});
function messageMetrics(value){
  return {
    characters:[...value].length,
    bytes:new TextEncoder().encode(value).length
  };
}

function validateMessage(rawValue){
  const value=rawValue.trim();
  const metrics=messageMetrics(value);

  if(!value){
    return {
      ok:false,
      message:'Enter a message before continuing.'
    };
  }

  if(metrics.characters>MAX_MESSAGE_CHARACTERS){
    return {
      ok:false,
      message:'Message exceeds the 280 character interface limit.'
    };
  }

  if(metrics.bytes>MAX_MESSAGE_BYTES){
    return {
      ok:false,
      message:'Message exceeds the 1120-byte smart contract limit.'
    };
  }

  return {
    ok:true,
    value,
    characters:metrics.characters,
    bytes:metrics.bytes
  };
}

function encodeUint256(value){
  return BigInt(value)
    .toString(16)
    .padStart(64,'0');
}

function bytesToHex(bytes){
  return Array.from(
    bytes,
    byte=>byte.toString(16).padStart(2,'0')
  ).join('');
}

function encodeInscriptionCall(message){
  const bytes=new TextEncoder().encode(message);
  const messageHex=bytesToHex(bytes);

  const paddedLength=
    Math.ceil(bytes.length/32)*64;

  const paddedMessage=
    messageHex.padEnd(paddedLength,'0');

  return (
    INSCRIBE_SELECTOR +
    encodeUint256(32n) +
    encodeUint256(BigInt(bytes.length)) +
    paddedMessage
  );
}

function canWrite(){
  return (
    !DEMO_MODE &&
    !transactionPending &&
    Boolean(wallet) &&
    network?.toLowerCase()===chain.chainIdHex
  );
}

function updateWriteButton(){
  const button=$('#inscribe');
  if(!button)return;

  const validation=
    validateMessage($('#message').value);

  button.disabled=
    !canWrite() ||
    !validation.ok;

  button.textContent=
    transactionPending
      ? 'TRANSACTION PENDING…'
      : 'WRITE TO CHAIN 1404 →';
}

$('#message').addEventListener('input',e=>{
  const metrics=messageMetrics(e.target.value);

  $('#count').textContent=
    `${metrics.characters} / 280`;

  updateWriteButton();
});
function updateWallet(){
  $('#connect').textContent=wallet?'DISCONNECT':'CONNECT WALLET';
  $('#walletStatus').textContent=wallet?`${shortAddress(wallet)} · ${network?.toLowerCase()===chain.chainIdHex?'CHAIN 1404':'WRONG NETWORK'}`:'NOT CONNECTED';
  $('#composerNotice').textContent=DEMO_MODE
    ? 'Live blockchain reads enabled. On-chain submission is currently disabled.'
    : 'Inscription currently unavailable.';

  updateWriteButton();

  if(!wallet){
    $('#dailyRemaining').textContent=
      'CONNECT WALLET TO CHECK';
  }else if(
    network?.toLowerCase() !==
    chain.chainIdHex
  ){
    $('#dailyRemaining').textContent=
      'SWITCH TO CHAIN 1404';
  }else{
    refreshAllowance();
  }

  if(filter==='mine')render();
}
async function connect(){
  if(wallet){wallet=null;network=null;updateWallet();return;}
  const provider=window.ethereum;
  if(!provider?.request){$('#composerNotice').textContent='No compatible wallet detected. Install an EIP-1193 wallet to connect.';return;}
  try{const accounts=await provider.request({method:'eth_requestAccounts'});wallet=accounts?.[0]||null;network=await provider.request({method:'eth_chainId'});updateWallet();}
  catch(error){$('#composerNotice').textContent=error?.code===4001?'Wallet connection was declined.':'Could not connect wallet. Please try again.';}
}
$('#connect').addEventListener('click',connect);
if(window.ethereum?.on){window.ethereum.on('accountsChanged',accounts=>{wallet=accounts?.[0]||null;updateWallet();});window.ethereum.on('chainChanged',value=>{network=value;updateWallet();});}
$('#inscribe').addEventListener('click',()=>{
  if(!canWrite())return;

  const validation=
    validateMessage($('#message').value);

  if(!validation.ok){
    $('#composerNotice').textContent=
      validation.message;
    updateWriteButton();
    return;
  }

  $('#reviewMessage').textContent=
    validation.value;

  $('#confirm').showModal();
});

async function waitForReceipt(
  provider,
  transactionHash,
  timeoutMs=120000
){
  const started=Date.now();

  while(Date.now()-started<timeoutMs){
    const receipt=
      await provider.request({
        method:'eth_getTransactionReceipt',
        params:[transactionHash]
      });

    if(receipt)return receipt;

    await new Promise(
      resolve=>setTimeout(resolve,2500)
    );
  }

  throw new Error(
    'Transaction submitted but confirmation timed out. Check your wallet or explorer before trying again.'
  );
}

async function submitInscription(){
  if(DEMO_MODE){
    $('#composerNotice').textContent=
      'On-chain submission remains locked.';
    return;
  }

  if(transactionPending)return;

  const provider=window.ethereum;

  if(!provider?.request){
    $('#composerNotice').textContent=
      'No compatible wallet detected.';
    return;
  }

  if(!wallet){
    $('#composerNotice').textContent=
      'Connect your wallet before writing to the Wall.';
    return;
  }

  const currentChain=
    await provider.request({
      method:'eth_chainId'
    });

  network=currentChain;

  if(
    currentChain?.toLowerCase() !==
    chain.chainIdHex
  ){
    $('#composerNotice').textContent=
      'Switch your wallet to BlockDAG Chain 1404 before continuing.';
    updateWallet();
    return;
  }

  const validation=
    validateMessage($('#message').value);

  if(!validation.ok){
    $('#composerNotice').textContent=
      validation.message;
    updateWriteButton();
    return;
  }

  const remaining=
    await getRemainingToday(wallet);

  if(remaining.value<=0n){
    $('#dailyRemaining').textContent=
      '0 OF 3 REMAINING';

    $('#composerNotice').textContent=
      'This wallet has reached today’s 3-inscription limit.';
    updateWriteButton();
    return;
  }

  const data=
    encodeInscriptionCall(validation.value);

  transactionPending=true;
  updateWriteButton();

  $('#composerNotice').textContent=
    'Confirm the transaction in your wallet. Only normal BlockDAG network gas is required.';

  try{
    const transactionHash=
      await provider.request({
        method:'eth_sendTransaction',
        params:[{
          from:wallet,
          to:chain.contractAddress,
          data
        }]
      });

    $('#composerNotice').textContent=
      'Transaction submitted. Waiting for Chain 1404 confirmation…';

    const receipt=
      await waitForReceipt(
        provider,
        transactionHash
      );

    if(
      receipt.status &&
      BigInt(receipt.status)!==1n
    ){
      throw new Error(
        'The blockchain transaction reverted.'
      );
    }

    $('#message').value='';
    $('#count').textContent='0 / 280';

    $('#composerNotice').textContent=
      'Inscription confirmed on Chain 1404.';

    await Promise.all([
      refreshLiveChain(),
      refreshFeed(),
      refreshAllowance()
    ]);

  }catch(error){
    console.error(
      'Inscription transaction failed:',
      error
    );

    if(error?.code===4001){
      $('#composerNotice').textContent=
        'Transaction was cancelled in your wallet.';
    }else{
      $('#composerNotice').textContent=
        error?.message ||
        'The inscription transaction could not be completed.';
    }

  }finally{
    transactionPending=false;
    updateWriteButton();
  }
}

$('#acknowledge').addEventListener(
  'click',
  event=>{
    event.preventDefault();

    if(DEMO_MODE){
      $('#confirm').close();
      $('#composerNotice').textContent=
        'On-chain submission remains locked.';
      return;
    }

    $('#confirm').close();
    submitInscription();
  }
);


// Live blockchain reads are enabled while transaction
// submission remains protected by DEMO_MODE.
updateWallet();
refreshLiveChain();

setInterval(
  refreshLiveChain,
  30000
);

setInterval(
  refreshFeed,
  30000
);
