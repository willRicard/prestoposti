/**
 * @file Waitlist Manager useful constants
 */

/**
 * Maximum restaurant seat capacity.
 *
 * Hardcoded to ten seats.
 */
export const SEAT_CAPACITY = 10;

/**
 * Allow single diners to join the queue.
 */
export const MIN_PARTY_SIZE = 1;

/**
 * Assume party size is most likely two.
 *
 * Default party size input value if not saved in local storage.
 */
export const DEFAULT_PARTY_SIZE = 2;

/**
 * Hide delay in milliseconds for modal UI components.
 */
export const MODAL_DELAY = 6000;

export type QueueItemData = {
  name: string;
  partySize: number;
};
