import {chain, DEMO_MODE} from './config.js';
import {
  moderateMessage,
  MODERATION_NOTICE
} from './moderation.js';
import {
  getWallSummary,
  getRemainingToday
} from './live-chain.js';
// Fictional preview entries. No block number, timestamp, transaction, or wallet is represented as real.
const demo = [
  'The community builds. The community delivers.',
  'BDAG Community was here. 🚀',
  'Building the future together on 1404!',
  'Node operator — proud to be part of this journey.',
  '1404 Genesis. Let’s go! 🔥',
  'Every message begins a new chapter.'
];
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
function render(){
  const cards=$('#cards');cards.replaceChildren();
  const entries=filter==='mine'?[]:filter==='latest'?demo.slice(0,5):demo;
  entries.slice(0,shown).forEach((message,i)=>{
    const row=document.createElement('article');row.className='message-row';
    const id=document.createElement('span');id.className='message-id';id.textContent=`#${String(demo.length-i).padStart(6,'0')}`;
    const body=document.createElement('div');body.className='message-body';
    const moderation=moderateMessage(message);
    if(moderation.hidden)row.classList.add('filtered');

    const quote=document.createElement('strong');
    quote.textContent=moderation.hidden
      ? MODERATION_NOTICE
      : `“${message}”`;

    const note=document.createElement('small');
    note.textContent='SAMPLE MESSAGE  ·  DEMO ONLY';

    body.append(quote,note);

    const tag=document.createElement('span');
    tag.className='message-tag';
    tag.textContent=moderation.hidden?'FILTERED':'DEMO';
    row.append(id,body,tag);cards.append(row);
  });
  if(!entries.length){const empty=document.createElement('p');empty.className='empty';empty.textContent=wallet?'My inscriptions will appear here when verified on-chain indexing is enabled.':'Connect a wallet to prepare for My Messages. On-chain indexing is not enabled.';cards.append(empty);}
  $('#resultCount').textContent=`${entries.length} demo entries`;
  $('#loadMore').hidden=filter!=='all'||shown>=entries.length;
}
render();
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;shown=5;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===button));render();}));
$('#loadMore').addEventListener('click',()=>{shown+=5;render();});
$('#message').addEventListener('input',e=>{$('#count').textContent=`${[...e.target.value].length} / 280`;});
function updateWallet(){
  $('#connect').textContent=wallet?'DISCONNECT':'CONNECT WALLET';
  $('#walletStatus').textContent=wallet?`${shortAddress(wallet)} · ${network?.toLowerCase()===chain.chainIdHex?'CHAIN 1404':'WRONG NETWORK'}`:'NOT CONNECTED';
  $('#composerNotice').textContent=DEMO_MODE
    ? 'Demo preview. On-chain submission is disabled pending contract and network review.'
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
