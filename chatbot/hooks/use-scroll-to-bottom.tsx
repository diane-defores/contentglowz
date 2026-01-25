/**
 * Auto-Scroll Hook for Chat Messages
 *
 * Manages scroll behavior for the chat message container.
 * Implements "sticky bottom" behavior where the container automatically
 * scrolls to show new messages, but respects user scroll position.
 *
 * Key behaviors:
 * - Auto-scrolls when new content arrives (if user was at bottom)
 * - Pauses auto-scroll when user scrolls up to read history
 * - Resumes auto-scroll when user returns to bottom
 */
import { useCallback, useEffect, useRef, useState } from "react";

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);
  /** Tracks active user scrolling to avoid fighting with user input */
  const isUserScrollingRef = useRef(false);

  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    isAtBottomRef.current = isAtBottom;
  }, [isAtBottom]);

  /**
   * Checks if container is scrolled to bottom (within 100px threshold).
   * The threshold provides a buffer to avoid jittery behavior near the edge.
   */
  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) {
      return true;
    }
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 100;
  }, []);

  /** Programmatically scroll to bottom with optional animation */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!containerRef.current) {
      return;
    }
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior,
    });
  }, []);

  /**
   * Track user scroll interactions.
   * Uses debounce pattern to detect when scrolling stops.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      // Mark as user scrolling
      isUserScrollingRef.current = true;
      clearTimeout(scrollTimeout);

      // Update isAtBottom state
      const atBottom = checkIfAtBottom();
      setIsAtBottom(atBottom);
      isAtBottomRef.current = atBottom;

      // Reset user scrolling flag after scroll ends
      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [checkIfAtBottom]);

  /**
   * Auto-scroll when content changes.
   * Uses MutationObserver and ResizeObserver to detect content updates.
   * Only scrolls if user was already at bottom (respects manual scrolling).
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const scrollIfNeeded = () => {
      // Only auto-scroll if user was at bottom and isn't actively scrolling
      if (isAtBottomRef.current && !isUserScrollingRef.current) {
        requestAnimationFrame(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "instant",
          });
          setIsAtBottom(true);
          isAtBottomRef.current = true;
        });
      }
    };

    // Watch for DOM changes
    const mutationObserver = new MutationObserver(scrollIfNeeded);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Watch for size changes
    const resizeObserver = new ResizeObserver(scrollIfNeeded);
    resizeObserver.observe(container);

    // Also observe children for size changes
    for (const child of container.children) {
      resizeObserver.observe(child);
    }

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  /** Called when scroll sentinel enters viewport (user scrolled to bottom) */
  function onViewportEnter() {
    setIsAtBottom(true);
    isAtBottomRef.current = true;
  }

  /** Called when scroll sentinel leaves viewport (user scrolled up) */
  function onViewportLeave() {
    setIsAtBottom(false);
    isAtBottomRef.current = false;
  }

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  };
}
