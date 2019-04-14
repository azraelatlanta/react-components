export const ACTIONS = {
    FILES: 1,
    KEY_DECRYPTED: 2,
    KEY_CANCELLED: 3,
};

export const DEFAULT_STATE = {
    keys: [],
    keyToDecrypt: undefined,
    done: false
};

const getNextState = (keys = []) => {
    const keyToDecrypt = keys.length ? keys.find(({ decryptedPrivateKey }) => !decryptedPrivateKey) : undefined;
    return {
        keyToDecrypt,
        done: keys.length && !keyToDecrypt
    }
};

export default (state, { type, payload }) => {
    if (type === ACTIONS.FILES) {
        const keysMap = payload.reduce((acc, key) => {
            acc[key.info.fingerprint] = key;
            return acc;
        }, Object.create(null));

        const uniqueKeys = Object.values(keysMap);

        return {
            keys: uniqueKeys,
            ...getNextState(uniqueKeys)
        }
    }

    if (type === ACTIONS.KEY_DECRYPTED) {
        const { fingerprint, decryptedPrivateKey } = payload;
        console.log('wtf', payload);

        const keys = state.keys.map((key) =>
            (key.info.fingerprint === fingerprint)
                ? { ...key, decryptedPrivateKey: decryptedPrivateKey }
                : key
        );

        return {
            keys,
            ...getNextState(keys)
        }
    }

    if (type === ACTIONS.KEY_CANCELLED) {
        const fingerprint = payload;
        const keys = state.keys.filter((key) => (key.info.fingerprint !== fingerprint));
        return {
            keys,
            ...getNextState(keys)
        }
    }
};
