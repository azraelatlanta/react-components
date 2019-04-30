import { useCallback } from 'react';
import { useCachedResult, useCache, useAuthenticationStore } from 'react-components';
import { prepareKeys } from 'proton-shared/lib/keys/keys';
import validateDependencies from './helpers/validateDependencies';

const KEY = 'addressesKeys';

const useAddressesKeys = (User, Addresses) => {
    const cache = useCache();
    const authenticationStore = useAuthenticationStore();

    const dependency = [Addresses];
    validateDependencies(cache, KEY, dependency);

    const load = useCallback(async () => {
        const keysResults = await Promise.all(Addresses.map((Address) => {
            return prepareKeys({
                Keys: Address.Keys,
                keyPassword: authenticationStore.getPassword(),
                OrganizationPrivateKey: User.OrganizationPrivateKey
            });
        }));
        return Addresses.reduce((acc, cur, i) => {
            acc[cur.ID] = keysResults[i];
        }, {});
    }, dependency);

    return useCachedResult(cache, KEY, load);
};

export default useAddressesKeys;
