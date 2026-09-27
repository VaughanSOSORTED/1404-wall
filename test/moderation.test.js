import { expect } from 'chai';

import {
  moderateMessage,
  normaliseForModeration,
  MODERATION_NOTICE
} from '../public/moderation.js';

describe('1404 Wall display moderation', function () {

  it('allows an ordinary community message', function () {
    const result = moderateMessage(
      'The community builds. The community delivers.'
    );

    expect(result.hidden).to.equal(false);
  });

  it('normalises case and punctuation', function () {
    expect(
      normaliseForModeration('HELLO---WORLD')
    ).to.equal('hello world');
  });

  it('detects a high-confidence profanity term', function () {
    const result = moderateMessage(
      'This message contains fuck'
    );

    expect(result.hidden).to.equal(true);
    expect(result.reason).to.equal('display-filter');
  });

  it('detects simple spacing evasion', function () {
    expect(
      moderateMessage('f u c k').hidden
    ).to.equal(true);
  });

  it('does not describe moderation as blockchain deletion', function () {
    expect(MODERATION_NOTICE)
      .to.include('blockchain record is unchanged');
  });

});
