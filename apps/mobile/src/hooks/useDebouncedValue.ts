//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useEffect, useState } from "react";

/** `value`, but only once it has stopped changing for `delayMs` (e.g. a search term being typed). */
export function useDebouncedValue<Value>(value: Value, delayMs: number): Value {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
