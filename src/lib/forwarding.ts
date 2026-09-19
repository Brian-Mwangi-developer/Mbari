import type {InboxAddress} from '@/api';

/**
 * Where the Gmail forwarding setup stands.
 *
 * - waiting: Gmail hasn't asked yet (or the user said an ask wasn't them).
 * - needs-confirmation: a mailbox asked to forward here; the user must say
 *   whether it's theirs. Only then does the app open Google's link.
 * - confirmed: the user confirmed it.
 */
export type ForwardingStage = 'waiting' | 'needs-confirmation' | 'confirmed';

export function forwardingStage(
  address: InboxAddress | null,
  dismissedRequestIds: readonly string[] = [],
): ForwardingStage {
  const request = address?.forwarding;
  if (!request) {
    return 'waiting';
  }
  if (request.confirmedAt) {
    return 'confirmed';
  }
  if (dismissedRequestIds.includes(request.id)) {
    return 'waiting';
  }
  return 'needs-confirmation';
}

/** How often the setup screen checks whether Gmail's email has arrived. */
export const FORWARDING_POLL_MS = 4000;
