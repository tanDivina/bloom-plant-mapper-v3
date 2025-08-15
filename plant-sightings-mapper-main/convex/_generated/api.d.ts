/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as plantIdentification from "../plantIdentification.js";
import type * as plantProfiles from "../plantProfiles.js";
import type * as plantSightings from "../plantSightings.js";
import type * as sampleData from "../sampleData.js";
import type * as tours from "../tours.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  plantIdentification: typeof plantIdentification;
  plantProfiles: typeof plantProfiles;
  plantSightings: typeof plantSightings;
  sampleData: typeof sampleData;
  tours: typeof tours;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
