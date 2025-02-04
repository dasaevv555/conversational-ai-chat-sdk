/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

export default function sleep(durationInMS: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, durationInMS));
}
