import { useCache, useAuthenticationStore } from 'react-components';
import { prepareKeys } from 'proton-shared/lib/keys/keys';
import { useUser } from './userModel';
import { useLayoutEffect, useCallback, useEffect, useRef, useState } from 'react';
import { STATUS } from 'proton-shared/lib/models/cache';




const useGetKeys = () => {
    const cache = useCache();
    const [User] = useUser();
    const authenticationStore = useAuthenticationStore();

    return (ID, keys) => {
        if (cache.has(ID)) {
            const { value: cachedValue, promise, result } = cache.get(ID);

            // Use the old promise or the old value if it exists
            if (keys === cachedValue) {
                console.log('using cached value');
                return promise || Promise.resolve(result);
            }
        }

        const promise = prepareKeys({
            Keys: keys,
            keyPassword: authenticationStore.getPassword(),
            OrganizationPrivateKey: User.OrganizationPrivateKey
        });

        const record = {
            value: keys,
            promise
        };
        cache.set(ID, record);

        promise
            .then((result) => {
                const record = {
                    value: keys,
                    result
                };
                cache.set(ID, record);

                return result;
            });

        return promise;
    };
};

export default useGetKeys;
