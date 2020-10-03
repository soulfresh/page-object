
function doWait(cb, end, timeout, resolve, reject) {
  setTimeout(() => {
    try {
      cb();
      resolve(true);
    } catch(e) {
      if (Date.now() > end) {
        reject(e);
      } else {
        doWait(cb, end, 60, resolve, reject);
      }
    }
  }, timeout);
}

/**
 * Replacement for @testing-library waitFor because
 * the latest version seems to have a defect where the
 * promise does not reject immediately when the callback
 * expectation is met.
 */
export function waitForMe(cb, timeout = 1000) {
  const start = Date.now();
  const end = start + timeout;

  return new Promise((resolve, reject) => {
    try {
      cb();
      resolve(true);
    } catch(e) {
      doWait(cb, end, 0, resolve, reject);
    }
  });
}
