import { firestore } from 'firebase/app';
import { MutableRefObject, useEffect, useReducer, useRef } from 'react';

interface PaginationOptions {
  limit?: number;
}

interface State<T> {
  query: firestore.Query | undefined;
  queryRef: undefined | MutableRefObject<firestore.Query | undefined>;
  firstDocRef: undefined | MutableRefObject<firestore.QueryDocumentSnapshot | undefined>;
  items: T[];
  docs: firestore.QueryDocumentSnapshot[];
  firstDoc: firestore.QueryDocumentSnapshot | undefined;
  lastDoc: firestore.QueryDocumentSnapshot | undefined;
  prevQuery: firestore.Query | undefined;
  nextQuery: firestore.Query | undefined;
  isLoading: boolean;
  isStart: boolean;
  isEnd: boolean;
  limit: number;
}

type ActionBase<K, V = void> = V extends void ? { type: K } : { type: K } & V;

type Action =
  | ActionBase<
      'SET-QUERY',
      {
        payload: {
          query: firestore.Query;
          queryRef: MutableRefObject<firestore.Query | undefined>;
          firstDocRef: MutableRefObject<firestore.QueryDocumentSnapshot | undefined>;
          limit: number;
        };
      }
    >
  | ActionBase<
      'LOAD',
      {
        payload: {
          value: firestore.QuerySnapshot;
          query: firestore.Query;
        };
      }
    >
  | ActionBase<'PREV'>
  | ActionBase<'NEXT'>;

const defaultGuard = <S>(state: S, a: never) => state;

const getReducer = <T>() => (state: State<T>, action: Action): State<T> => {
  switch (action.type) {
    case 'SET-QUERY': {
      const { query, queryRef, firstDocRef, limit } = action.payload;
      return {
        ...state,
        query: query.limit(limit),
        queryRef,
        firstDocRef,
        limit,
        isLoading: true,
      };
    }
    case 'LOAD': {
      const { value } = action.payload;
      const docs = value.docs;

      const items = docs.map((doc) => {
        return doc.data() as T;
      });

      const firstDoc = docs[0];
      const lastDoc = docs[docs.length - 1];
      const prevQuery =
        (state.queryRef?.current && state.queryRef.current.endBefore(firstDoc).limitToLast(state.limit)) || undefined;
      const nextQuery =
        (state.queryRef?.current && state.queryRef.current.startAfter(lastDoc).limit(state.limit)) || undefined;

      const firstDocRef = state.firstDocRef;
      if (firstDocRef && firstDocRef.current === undefined) {
        firstDocRef.current = firstDoc;
      }

      return {
        ...state,
        isLoading: false,
        firstDoc,
        firstDocRef,
        lastDoc,
        prevQuery,
        nextQuery,
        items,
        isStart: firstDocRef?.current?.isEqual(firstDoc) || false,
        isEnd: items.length < state.limit,
      };
    }

    case 'NEXT': {
      return {
        ...state,
        isLoading: true,
        query: state.nextQuery,
      };
    }

    case 'PREV': {
      return {
        ...state,
        isLoading: true,
        query: state.prevQuery,
      };
    }
    default: {
      return defaultGuard(state, action);
    }
  }
  return state;
};

const initialState = {
  query: undefined,
  queryRef: undefined,
  firstDocRef: undefined,
  items: [],
  docs: [],
  firstDoc: undefined,
  lastDoc: undefined,
  prevQuery: undefined,
  nextQuery: undefined,
  isLoading: true,
  isStart: true,
  isEnd: false,
  limit: 10,
};

const usePagination = <T = firestore.DocumentData>(firestoreQuery: firestore.Query, options: PaginationOptions) => {
  const [state, dispatch] = useReducer(getReducer<T>(), initialState);
  const queryRef = useRef<firestore.Query | undefined>(undefined);
  const firstDocRef = useRef<firestore.QueryDocumentSnapshot | undefined>(undefined);

  const { limit = 10 } = options;

  useEffect(() => {
    if (firestoreQuery !== undefined) {
      if (queryRef.current === undefined) {
        queryRef.current = firestoreQuery;
      }
      dispatch({
        type: 'SET-QUERY',
        payload: {
          query: firestoreQuery,
          queryRef,
          firstDocRef,
          limit,
        },
      });
    }
  }, []);

  useEffect(() => {
    if (state.query !== undefined) {
      const unsubscribe = state.query.onSnapshot((snap) => {
        dispatch({
          type: 'LOAD',
          payload: { value: snap, query: state.query as firestore.Query },
        });
      });

      return () => unsubscribe();
    }
  }, [state.query]);

  return {
    items: state.items,
    isLoading: state.isLoading,
    isStart: state.isStart,
    isEnd: state.isEnd,
    getPrev: () => dispatch({ type: 'PREV' }),
    getNext: () => dispatch({ type: 'NEXT' }),
  };
};

export { usePagination };
