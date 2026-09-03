import {
  Query,
  CollectionReference,
  Unsubscribe,
  onSnapshot,
  DocumentReference,
  FirestoreError,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ZodType, TypeOf, ZodError, z } from 'zod';
import { Ref, ref, onScopeDispose, watch } from 'vue';

// Mismo patrón que piddo: suscripción en vivo a una colección/query validada
// con zod; cada doc sale con `_id`. Los docs que no validan se descartan.
export const useCollection = <T extends ZodType>(
  reference: Ref<Query | CollectionReference | null>,
  validator: T
) => {
  const extendedValidator = z.intersection(
    validator,
    z.object({
      _id: z.string(),
    })
  );

  const unsubscribe = ref<Unsubscribe>();
  const documents = ref<Array<TypeOf<typeof extendedValidator>>>([]);
  const loading = ref(true);
  const error = ref<ZodError | FirestoreError>();

  const loadDocuments = () => {
    const fbRef = reference.value;
    loading.value = true;
    if (unsubscribe.value) {
      unsubscribe.value();
    }

    if (fbRef == null) {
      documents.value = [];
      loading.value = false;
      return;
    }

    // Cache de parseos por doc: con docChanges() solo se re-valida lo que
    // cambió en cada snapshot.
    const parsedCache = new Map<
      string,
      TypeOf<typeof extendedValidator> | null
    >();

    unsubscribe.value = onSnapshot(
      fbRef,
      (snapshot) => {
        let err: ZodError | undefined = undefined;

        for (const change of snapshot.docChanges()) {
          if (change.type === 'removed') {
            parsedCache.delete(change.doc.id);
            continue;
          }
          const docData = { ...change.doc.data(), _id: change.doc.id };
          const validation = extendedValidator.safeParse(docData);
          if (validation.success) {
            parsedCache.set(change.doc.id, validation.data);
          } else {
            console.log('Failed to validate document', {
              docData,
              error: validation.error,
            });
            parsedCache.set(change.doc.id, null);
            err = validation.error;
          }
        }

        const nextDocuments: Array<TypeOf<typeof extendedValidator>> = [];
        for (const doc of snapshot.docs as QueryDocumentSnapshot[]) {
          const parsed = parsedCache.get(doc.id);
          if (parsed === null || parsed === undefined) continue;
          nextDocuments.push(parsed);
        }

        documents.value = nextDocuments;
        error.value = err;
        loading.value = false;
      },
      (err) => {
        console.error('Failed to get snapshot', err);
        documents.value = [];
        error.value = err;
        loading.value = false;
      }
    );
  };

  const cleanWatch = watch(reference, loadDocuments, { immediate: true });

  // onScopeDispose y no onUnmounted: estos composables también viven dentro
  // de stores de Pinia.
  onScopeDispose(() => {
    cleanWatch();
    if (unsubscribe.value) {
      unsubscribe.value();
    }
  });

  return {
    documents,
    loading,
    error,
    reloadDocuments: loadDocuments,
  };
};

export const useDocument = <T extends ZodType>(
  reference: Ref<DocumentReference | null>,
  validator: T
) => {
  const extendedValidator = z.intersection(
    validator,
    z.object({
      _id: z.string(),
    })
  );

  const unsubscribe = ref<Unsubscribe>();
  const document = ref<TypeOf<typeof extendedValidator>>();
  const loading = ref(true);
  const exists = ref(false);
  const error = ref<ZodError | FirestoreError>();

  const cleanWatch = watch(
    reference,
    (fbRef) => {
      document.value = undefined;
      loading.value = true;
      if (unsubscribe.value) {
        unsubscribe.value();
      }

      if (!fbRef) {
        exists.value = false;
        loading.value = false;
        return;
      }

      unsubscribe.value = onSnapshot(
        fbRef,
        (snapshot) => {
          document.value = undefined;
          let err: ZodError | undefined = undefined;

          if (!snapshot.exists()) {
            exists.value = false;
          } else {
            exists.value = true;
            const docData = { ...snapshot.data(), _id: snapshot.id };
            const validation = extendedValidator.safeParse(docData);
            if (validation.success) {
              document.value = validation.data;
            } else {
              console.log('Failed to validate document', {
                docData,
                error: validation.error,
              });
              err = validation.error;
            }
          }

          error.value = err;
          loading.value = false;
        },
        (err) => {
          console.error('Failed to get document snapshot', err);
          document.value = undefined;
          error.value = err;
          exists.value = false;
          loading.value = false;
        }
      );
    },
    { immediate: true }
  );

  onScopeDispose(() => {
    cleanWatch();
    if (unsubscribe.value) {
      unsubscribe.value();
    }
  });

  return { document, loading, error, exists };
};
