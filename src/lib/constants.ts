/**
 * @file Waitlist Manager useful constants
 */

/**
 * Service time per person in milliseconds.
 *
 * Hardcoded to three seconds per person.
 */
export const SERVICE_TIME = 3000;

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
 * Queue management JWT lifetime.
 *
 * Defaults to two hours.
 */
export const QUEUE_TOKEN_LIFETIME = "2h";

/**
 * Queue token signing algorithm.
 *
 * Defaults to symmetric HS256 (requires a 32-byte long secret in .env).
 */
export const QUEUE_TOKEN_ALG = "HS256";

/**
 * Hide delay in milliseconds for modal UI components.
 */
export const MODAL_DELAY = 6000;

export type QueueItemData = {
  name: string;
  partySize: number;
};

export type ServerQueueItemData = QueueItemData & {
  state: "waiting" | "active" | "done";
  joinDate: Date;
  checkInDate?: Date;
  checkOutDate?: Date;
};

/**
 * Authenticate queue management with server.
 */
export type PrestoPostiTokenMessage = {
  type: "token";
  token: string;
};

/**
 * Notify client of check in eligibility.
 */
export type PrestoPostiEligibilityMessage = {
  type: "eligibility";
  partySize: number;
  eligible: boolean;
};

/**
 * Perform check in via WebSocket.
 *
 * partySize and checkInDate are present in server reply.
 */
export type PrestoPostiCheckInMessage = {
  type: "checkin";
  token: string;
  partySize?: number;
  checkInDate?: Date | string;
};

/**
 * Notify client of check out via WebSocket.
 */
export type PrestoPostiCheckOutMessage = {
  type: "checkout";
  checkOutDate: Date | string;
};

export type PrestoPostiMessage =
  | PrestoPostiTokenMessage
  | PrestoPostiEligibilityMessage
  | PrestoPostiCheckInMessage
  | PrestoPostiCheckOutMessage;
