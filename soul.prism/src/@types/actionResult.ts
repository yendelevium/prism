
export type ActionResult<T> = 
    | { success: true, data: T}
    | { success: false, error: string};


/**
 * Function to easily retrieve and make use of the results of server actions that return ActionResult<T>
 * 
 * @example Use unwrap with await
 *          ```ts
 *              try {
 *                  unwrap(await serverAction());
 *               }
 *              catch (err) {
 *                  // Handle Error
 *              }
 *           ```
 * @throws Error with reason if action was unsuccessful
 * @param result The ActionResult that needs to be unwrapped
 * @returns The data
 */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}