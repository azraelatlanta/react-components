import { useCallback, useEffect, useState } from 'react';
import { useCachedResult, useCache, useAuthenticationStore } from 'react-components';
import { prepareUserKeys } from 'proton-shared/lib/keys/keys';
import validateDependencies from './helpers/validateDependencies';
import createKeysManager, { USER_ID_KEYS } from 'proton-shared/lib/keys/keysManager'

const KEY = 'keysManager';

const getOrSetKeysManager = (cache) => {
    if (cache.has(KEY)) {
        return cache.get(KEY);
    }
    const keysManager = createKeysManager();
    cache.set(KEY, keysManager);
    return keysManager;
};

const useKeysManager = () => {
    const cache = useCache();
    return getOrSetKeysManager(cache);
};

const useKeys = (User) => {
    const keysManager = useKeysManager();
    const authenticationStore = useAuthenticationStore();

    keysManager.updateUser(User, authenticationStore.getPassword());

    const [result, setResult] = useState(() => {
        return keysManager.getUserKeys();
    });

    useEffect(() => {
        const unsubscribe = keysManager.subscribe((ID) => {
            if (ID === USER_ID_KEYS) {
                setResult(keysManager.getUserKeys());
            }
        });

        setResult(keysManager.getUserKeys());

        return unsubscribe;
    }, []);

    return result;
};

export default useKeys;
