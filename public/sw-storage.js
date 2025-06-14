
// Storage operations for service worker
export async function getStoredSignals() {
  try {
    return new Promise((resolve) => {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('binary_signals');
        resolve(stored ? JSON.parse(stored) : []);
      } else {
        resolve([]);
      }
    });
  } catch (error) {
    console.error('Failed to get stored signals:', error);
    return [];
  }
}

export async function getStoredAntidelay() {
  try {
    return new Promise((resolve) => {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('antidelay_seconds');
        resolve(stored ? parseInt(stored, 10) : 15);
      } else {
        resolve(15);
      }
    });
  } catch (error) {
    console.error('Failed to get stored antidelay:', error);
    return 15;
  }
}

export async function updateStoredSignals(signals) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('binary_signals', JSON.stringify(signals));
    }
  } catch (error) {
    console.error('Failed to update stored signals:', error);
  }
}
