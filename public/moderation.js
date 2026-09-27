import { HIGH_CONFIDENCE_TERMS } from './profanity-data.js';

/*
 * Interface-only moderation.
 *
 * This module NEVER edits blockchain data and NEVER determines
 * whether content is legal or illegal.
 *
 * It only decides whether the 1404 Wall website displays the
 * original message text.
 */

const CUSTOM_BLOCKED_TERMS = Object.freeze([
  // Project-specific display terms can be added here later.
]);

const LEET_MAP = Object.freeze({
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's'
});

export function normaliseForModeration(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split('')
    .map(char => LEET_MAP[char] || char)
    .join('')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const BLOCKED_TERMS = Object.freeze(
  [...HIGH_CONFIDENCE_TERMS, ...CUSTOM_BLOCKED_TERMS]
    .map(normaliseForModeration)
    .filter(term => term.length >= 3)
);

export function moderateMessage(message) {
  const normalised = normaliseForModeration(message);
  const compacted = normalised.replace(/\s+/g, '');

  if (!normalised) {
    return {
      hidden: false,
      reason: null
    };
  }

  for (const term of BLOCKED_TERMS) {
    const wordPattern = new RegExp(
      `(^|\\s)${escapeRegExp(term)}(?=\\s|$)`
    );

    const compactTerm = term.replace(/\s+/g, '');

    if (
      wordPattern.test(normalised) ||
      (
        compactTerm.length >= 4 &&
        compacted.includes(compactTerm)
      )
    ) {
      return {
        hidden: true,
        reason: 'display-filter'
      };
    }
  }

  return {
    hidden: false,
    reason: null
  };
}

export const MODERATION_NOTICE =
  'Message hidden by the 1404 Wall display filter. The original blockchain record is unchanged.';
