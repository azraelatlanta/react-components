import { useCache } from 'react-components';
import { useLayoutEffect, useReducer } from 'react';
import { STATUS } from 'proton-shared/lib/models/cache';
import { shallowEqual } from 'proton-shared/lib/helpers/array';


const getState = ({ value, status }) => {
    return [
        status === STATUS.PENDING || status === STATUS.RESOLVED ? value : undefined,
        status === STATUS.PENDING,
        status === STATUS.REJECTED ? value : undefined
    ];
};

const reducer = (oldValue, newValue) => {
    if (shallowEqual(oldValue, newValue)) {
        return oldValue;
    }
    return newValue;
};

/**
 * Caches an async result globally in the cache.
 * Does not support using the same hook in parallel.
 * @param {String} key
 * @param {Function} miss - Returning a promise
 * @param {Array} dependencies - When to recall the function
 * @return {[value, loading]}
 */
const useCachedAsyncResult = (key, miss, dependencies) => {
    const cache = useCache();

    const [state, dispatch] = useReducer(reducer, undefined, () => {
        const record = cache.get(key) || { status: STATUS.PENDING };
        return getState(record);
    });

    useLayoutEffect(() => {
        const oldRecord = cache.get(key) || {};
        dispatch(getState(oldRecord));

        if (shallowEqual(oldRecord.dependencies, dependencies)) {
            return;
        }

        const promise = miss();
        const record = {
            status: STATUS.PENDING,
            value: oldRecord.value,
            promise,
            dependencies
        };

        cache.set(key, record);

        promise
            .then((value) => {
                return {
                    status: STATUS.RESOLVED,
                    value,
                    dependencies
                }
            })
            .catch((error) => {
                return {
                    status: STATUS.REJECTED,
                    value: error,
                    dependencies
                }
            })
            .then((record) => {
                const oldRecord = cache.get(key) || {};
                // Ensure it's the latest promise that is running
                if (oldRecord.promise !== promise) {
                    return;
                }
                cache.set(key, record);
                dispatch(getState(record));
            });
    });

    return state;
};

export default useCachedAsyncResult;
