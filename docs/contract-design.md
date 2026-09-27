# The 1404 Wall — contract design

## Status

`contracts/Wall1404.sol` is implemented and covered by automated local
tests.

It has **not yet been deployed to BlockDAG Mainnet**.

## V1 inscription model

Each successful call to:

`inscribe(string message)`

performs the following:

1. rejects an empty byte string;
2. enforces the 1,120-byte ceiling;
3. calculates the current UTC day bucket;
4. verifies that the sender has made fewer than 3 successful
   inscriptions in that bucket;
5. increments the inscription counter;
6. emits `Inscribed(id, author, message, timestamp)`.

There is no application-level Wall posting fee.

The sender pays normal blockchain transaction gas.

## Daily limit

The UTC bucket is calculated using:

`block.timestamp / 1 days`

Each wallet can successfully inscribe no more than 3 messages per
bucket.

The restriction is wallet-based rather than identity-based.

## Message length

The browser provides a 280-character user-facing limit.

The smart contract independently enforces a 1,120-byte UTF-8 ceiling.

These limits are deliberately distinct. Solidity does not cheaply
provide the same Unicode character/grapheme counting behaviour as the
browser.

## Immutability

There is no owner/admin role.

There is no contract function for editing or deleting inscriptions.

Normal blockchain finality and chain reorganisations still apply.

The canonical inscription history is represented by contract events
and is intended to be read/indexed off-chain.

## Display moderation

Moderation is deliberately outside the smart contract.

The 1404 Wall website can decide not to display original message text
without changing the blockchain inscription.

This separation means moderation policy can evolve without introducing
an administrator capable of modifying blockchain history.

The website should describe this accurately:

**The blockchain is the record. This website is a filtered view.**

Website filtering must not be represented as deletion of the
underlying inscription.

A moderation decision is not a legal determination about the message.

## User acknowledgement

Before production submission, the interface should require the user to
review a clear permanence/responsibility acknowledgement before the
wallet transaction is initiated.

The acknowledgement is an interface safeguard and does not alter the
smart contract.

## Before Mainnet deployment

Before deployment:

- verify canonical Chain 1404 RPC and explorer details;
- verify native BDAG network metadata;
- confirm the target EVM version is supported by Chain 1404;
- estimate deployment and inscription gas;
- review ABI and deployed bytecode;
- run the complete automated test suite;
- perform a final security review;
- deploy from an appropriate deployment wallet;
- record the transaction, block and deployed contract address;
- verify the deployment before enabling the frontend.
