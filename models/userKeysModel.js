import { useCallback } from 'react';
import { useCachedResult, useCache, useAuthenticationStore } from 'react-components';
import { prepareKeys } from 'proton-shared/lib/keys/keys';
import validateDependencies from './helpers/validateDependencies';

const KEY = 'userKeys';

const useUserKeys = (User) => {
    const cache = useCache();
    const authenticationStore = useAuthenticationStore();

    const dependency = [User.Keys];
    validateDependencies(cache, KEY, dependency);

    const load = useCallback(() => {
        return prepareKeys({
            Keys: User.Keys,
            keyPassword: authenticationStore.getPassword(),
            OrganizationPrivateKey: User.OrganizationPrivateKey
        });
    }, dependency);

    return useCachedResult(cache, KEY, load);
};

export default useUserKeys;
