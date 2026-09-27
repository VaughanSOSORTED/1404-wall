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
$('#message').addEventListener('input',e=>{$('#count').textContent=`${[...e.target.value].length} / 280`;});
function updateWallet(){
  $('#connect').textContent=wallet?'DISCONNECT':'CONNECT WALLET';
  $('#walletStatus').textContent=wallet?`${shortAddress(wallet)} · ${network?.toLowerCase()===chain.chainIdHex?'CHAIN 1404':'WRONG NETWORK'}`:'NOT CONNECTED';
  $('#composerNotice').textContent=DEMO_MODE
    ? 'Live blockchain reads enabled. On-chain submission is currently disabled.'
    : 'Inscription currently unavailable.';

  $('#inscribe').disabled=true;

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
// Confirmation component remains inaccessible until an audited live integration is implemented.
$('#inscribe').addEventListener('click',()=>{const value=$('#message').value.trim();if(!value||[...value].length>280)return;$('#reviewMessage').textContent=value;$('#confirm').showModal();});


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
