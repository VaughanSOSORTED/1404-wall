# The 1404 Wall

The 1404 Wall is a community-built BlockDAG Chain 1404 dApp designed
to let wallet holders leave short public inscriptions on-chain.

The project is currently under development.

The production smart contract has **not yet been deployed**.

## Core rules

- Chain ID: `1404`
- Users pay normal network gas in BDAG.
- The Wall charges no additional posting fee.
- Maximum 3 successful inscriptions per wallet per UTC day.
- User-facing message limit: 280 Unicode characters.
- Contract safety ceiling: 1,120 UTF-8 bytes.
- Each confirmed inscription receives a sequential ID.
- Events record inscription ID, author wallet, message and timestamp.
- There is no owner/admin edit or delete mechanism.

## Think before you post

Blockchain publication may be permanent.

Users should not publish personal/private information, unlawful
content, threats, defamatory material or anything they would not want
publicly associated with their wallet address.

Users remain responsible for the content they submit.

Blockchain publication does not exempt a user from applicable law.

Before production launch, the project's public Terms & Disclaimer
should receive appropriate legal review.

## Blockchain record vs website display

**The blockchain is the record. This website is a filtered view.**

A confirmed inscription can remain part of the blockchain record even
when the 1404 Wall website chooses not to display the original message
text.

Website moderation does not delete or edit blockchain history.

The interface may hide profanity, abusive language, spam, malicious
content or other material according to its display policy.

A moderation decision is not a determination that content is legal or
illegal.

## Moderation implementation

The initial English profanity dataset is generated from the
MIT-licensed `cuss` package.

The website uses high-confidence entries together with local
project-specific display rules.

The moderation layer performs basic normalisation to detect some
spacing, punctuation and character-substitution attempts.

No automated word-list filter is perfect. False positives and missed
content are possible.

The moderation layer belongs to the website, not the smart contract,
so display rules can be improved without redeploying the contract.

## Anti-spam

The smart contract enforces a maximum of 3 successful inscriptions per
wallet per UTC day.

The UTC bucket is derived from `block.timestamp / 1 days`.

This limits an individual wallet. It does not prevent a person from
operating multiple wallets.

## Smart contract

The contract is:

`contracts/Wall1404.sol`

It currently:

- rejects empty messages;
- rejects messages above the byte ceiling;
- enforces the daily wallet limit;
- maintains a sequential inscription count;
- emits `Inscribed` events;
- reports current-day usage and remaining allowance;
- contains no owner/admin, edit or delete mechanism.

Automated contract tests are located in:

`test/Wall1404.js`

## Message length

The browser presents a 280-character limit.

The contract separately enforces a 1,120-byte UTF-8 ceiling.

These are not mathematically identical limits. The browser provides
the user-facing character restriction while the contract provides an
independent byte-level safety boundary.

## Frontend

The frontend uses static HTML, CSS and ES modules served by Firebase
Hosting.

While `DEMO_MODE` remains enabled:

- blockchain submission is disabled;
- displayed messages are fictional samples;
- the daily remaining count is illustrative;
- no production contract interaction occurs.

The production integration must replace these states with verified
contract data.

## Transaction acknowledgement

Before a production transaction is sent to the user's wallet, the
interface is designed to present a final acknowledgement explaining
that:

- the message and wallet address may become permanently public;
- the website cannot edit or delete a confirmed inscription;
- the user is responsible for submitted content;
- blockchain publication does not exempt the user from applicable law;
- the website may hide content without removing the blockchain record.

## Security

Never place private keys, seed phrases, service-account credentials or
administrative secrets in the frontend or repository.

Wallet transactions must be signed by the user's own wallet.

Before Mainnet integration, independently verify the canonical Chain
1404 RPC, explorer, native currency metadata and deployed contract
address.

## Production gate

Before smart-contract deployment:

1. verify canonical Chain 1404 network information;
2. confirm EVM compatibility for the compiled bytecode;
3. run the complete automated test suite;
4. estimate deployment and inscription gas;
5. review ABI and bytecode;
6. complete a final contract/security review;
7. deploy from an appropriate deployment wallet;
8. record and verify the deployment transaction and contract address.

Frontend deployment and smart-contract deployment are separate actions.

## Firebase deployment

Before deploying Firebase Hosting, confirm both Google Cloud and
Firebase are targeting:

`bdag-1404-wall-b4889`

Do not deploy simply because local tests pass.
