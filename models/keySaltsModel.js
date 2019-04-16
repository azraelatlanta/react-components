import { useCallback } from 'react';
import { useCachedResult, useApi, useCache } from 'react-components';
import { getKeySalts } from 'proton-shared/lib/api/keys';

const KEY = 'keySalts';

const useKeySalts = () => {
    const api = useApi();
    const cache = useCache();

    const load = useCallback(() => {
        return api(getKeySalts()).then(({ KeySalts }) => KeySalts);
    }, []);

    return useCachedResult(cache, KEY, load);
};

export default useKeySalts;
