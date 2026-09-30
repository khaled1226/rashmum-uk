/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as automation from "../automation.js";
import type * as automationStore from "../automationStore.js";
import type * as chat from "../chat.js";
import type * as chatStore from "../chatStore.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as knowledge from "../knowledge.js";
import type * as messages from "../messages.js";
import type * as messagesStore from "../messagesStore.js";
import type * as status from "../status.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  automation: typeof automation;
  automationStore: typeof automationStore;
  chat: typeof chat;
  chatStore: typeof chatStore;
  crons: typeof crons;
  email: typeof email;
  knowledge: typeof knowledge;
  messages: typeof messages;
  messagesStore: typeof messagesStore;
  status: typeof status;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
