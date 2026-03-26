import { useRef, useCallback, useMemo } from 'react';

/**
 * Debounce function para evitar chamadas excessivas
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function para limitar frequência de chamadas
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Hook para memoização estável de objetos
 */
export function useStableMemo<T>(value: T, deps: React.DependencyList): T {
  const ref = useRef<T>();
  const depsRef = useRef<React.DependencyList>();

  return useMemo(() => {
    if (!depsRef.current || !areEqual(deps, depsRef.current)) {
      ref.current = value;
      depsRef.current = deps;
    }
    return ref.current as T;
  }, deps);
}

/**
 * Comparação profunda simples para arrays
 */
function areEqual(a: React.DependencyList, b: React.DependencyList): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

/**
 * Hook para debounce de valores
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook otimizado para callbacks
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const ref = useRef<T>(callback);
  ref.current = callback;

  return useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, deps) as T;
}

/**
 * Utilitário para lazy loading de componentes
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return React.lazy(importFn);
}

/**
 * Cache simples para resultados de funções
 */
class FunctionCache<T extends (...args: any[]) => any> {
  private cache = new Map<string, ReturnType<T>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: string, fn: T, ...args: Parameters<T>): ReturnType<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const result = fn(...args);

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, result);
    return result;
  }

  clear() {
    this.cache.clear();
  }
}

export const functionCache = new FunctionCache();

/**
 * Intersection Observer hook para lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [(node: Element | null) => void, boolean] {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [element, setElement] = React.useState<Element | null>(null);

  React.useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return [setElement, isIntersecting];
}

// Importar React no final para evitar conflitos
import React from 'react';