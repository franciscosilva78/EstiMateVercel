import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para gerenciar foco e navegação por teclado
 */
export function useFocusManagement() {
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const currentFocusIndex = useRef(0);

  const registerFocusableElement = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    if (!focusableElementsRef.current.includes(element)) {
      focusableElementsRef.current.push(element);
    }
  }, []);

  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    const { key, shiftKey } = event;
    const elements = focusableElementsRef.current;

    if (elements.length === 0) return;

    switch (key) {
      case 'Tab':
        // Não interferir com Tab nativo, apenas rastrear
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        currentFocusIndex.current = (currentFocusIndex.current + 1) % elements.length;
        elements[currentFocusIndex.current]?.focus();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        currentFocusIndex.current =
          currentFocusIndex.current === 0
            ? elements.length - 1
            : currentFocusIndex.current - 1;
        elements[currentFocusIndex.current]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        currentFocusIndex.current = 0;
        elements[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        currentFocusIndex.current = elements.length - 1;
        elements[elements.length - 1]?.focus();
        break;
    }
  }, []);

  const clearFocusableElements = useCallback(() => {
    focusableElementsRef.current = [];
    currentFocusIndex.current = 0;
  }, []);

  return {
    registerFocusableElement,
    handleKeyboardNavigation,
    clearFocusableElements
  };
}

/**
 * Hook para anúncios para screen readers
 */
export function useScreenReaderAnnouncements() {
  const announcementRef = useRef<HTMLDivElement>();

  useEffect(() => {
    // Criar elemento para anúncios
    if (!announcementRef.current) {
      const element = document.createElement('div');
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-atomic', 'true');
      element.style.position = 'absolute';
      element.style.left = '-10000px';
      element.style.width = '1px';
      element.style.height = '1px';
      element.style.overflow = 'hidden';
      document.body.appendChild(element);
      announcementRef.current = element;
    }

    return () => {
      if (announcementRef.current && document.body.contains(announcementRef.current)) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string) => {
    if (announcementRef.current) {
      // Limpar antes de anunciar para garantir que seja lido
      announcementRef.current.textContent = '';
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = message;
        }
      }, 100);
    }
  }, []);

  return { announce };
}

/**
 * Hook para gerenciar preferências de acessibilidade
 */
export function useAccessibilityPreferences() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
  const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  return {
    prefersReducedMotion,
    prefersHighContrast,
    prefersColorScheme
  };
}

/**
 * Hook para skip links
 */
export function useSkipLinks() {
  const skipLinksRef = useRef<HTMLDivElement>(null);

  const createSkipLink = useCallback((targetId: string, text: string) => {
    const link = document.createElement('a');
    link.href = `#${targetId}`;
    link.textContent = text;
    link.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500';

    if (skipLinksRef.current) {
      skipLinksRef.current.appendChild(link);
    }

    return link;
  }, []);

  return { skipLinksRef, createSkipLink };
}