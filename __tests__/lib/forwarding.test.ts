/** @format */
import type {InboxAddress} from '@/api';
import {forwardingStage} from '@/lib/forwarding';

const address = (forwarding: InboxAddress['forwarding']): InboxAddress => ({
  address: 'brian-7f3a@in.mbari.com',
  localPart: 'brian-7f3a',
  domain: 'in.mbari.com',
  forwarding,
});

const request = {
  id: 'fr_1',
  provider: 'gmail',
  requestedBy: 'reader@gmail.com',
  receivedAt: '2026-09-14T09:09:21.000Z',
  confirmedAt: null,
};

describe('forwardingStage', () => {
  it('waits while the address has not loaded or Gmail has not asked', () => {
    expect(forwardingStage(null)).toBe('waiting');
    expect(forwardingStage(address(null))).toBe('waiting');
  });

  it('asks the user once a mailbox requests to forward', () => {
    expect(forwardingStage(address(request))).toBe('needs-confirmation');
  });

  it('goes back to waiting when the user says the request was not theirs', () => {
    expect(forwardingStage(address(request), ['fr_1'])).toBe('waiting');
  });

  it('only treats an explicit confirmation as confirmed', () => {
    expect(
      forwardingStage(address({...request, confirmedAt: '2026-09-14T09:10:00.000Z'})),
    ).toBe('confirmed');
  });
});
