import { useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, DocumentReference, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface UseOptimizedFirestoreOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Hook otimizado para escutar mudanças do Firestore com debounce e cache
 */
export function useOptimizedFirestore<T>(
  docPath: string,
  onUpdate: (data: T | null) => void,
  options: UseOptimizedFirestoreOptions = {}
) {
  const { enabled = true, onError } = options;
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastDataRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedUpdate = useCallback((data: T | null) => {
    const dataString = JSON.stringify(data);

    // Evita updates desnecessários se os dados não mudaram
    if (dataString === lastDataRef.current) {
      return;
    }

    // Debounce para evitar múltiplas atualizações rápidas
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      lastDataRef.current = dataString;
      onUpdate(data);
    }, 50); // 50ms debounce
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled || !docPath) {
      return;
    }

    const docRef = doc(db, docPath) as DocumentReference<T>;

    unsubscribeRef.current = onSnapshot(
      docRef,
      (docSnap: DocumentSnapshot<T>) => {
        if (docSnap.exists()) {
          debouncedUpdate({ id: docSnap.id, ...docSnap.data() } as T);
        } else {
          debouncedUpdate(null);
        }
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        onError?.(error);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [docPath, enabled, debouncedUpdate, onError]);

  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return cleanup;
}