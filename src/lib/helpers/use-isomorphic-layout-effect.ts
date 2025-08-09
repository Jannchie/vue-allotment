import { onMounted, onUpdated } from 'vue';

/**
 * Vue equivalent of React's useIsomorphicLayoutEffect
 * Uses onMounted and onUpdated to mimic the behavior
 */
export function useIsomorphicLayoutEffect(
  callback: () => void | (() => void),
  deps?: any[]
): void {
  let cleanup: (() => void) | void;

  const runCallback = () => {
    if (cleanup) {
      cleanup();
    }
    cleanup = callback();
  };

  onMounted(() => {
    runCallback();
  });

  // If deps are provided, we need to watch them
  if (deps && deps.length > 0) {
    onUpdated(() => {
      runCallback();
    });
  }

  // Cleanup on unmount
  onMounted(() => {
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  });
}

export default useIsomorphicLayoutEffect;