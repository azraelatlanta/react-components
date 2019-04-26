import { uniqueBy } from 'proton-shared/lib/helpers/array';

export const ACTIONS = {
    SELECT_FILES: 1,
    KEY_DECRYPTED: 2,
    KEY_CANCELLED: 5
};

export const keyDecrypted = ({ decryptedPrivateKey, fingerprint }) => ({
    type: ACTIONS.KEY_DECRYPTED,
    payload: {
        decryptedPrivateKey,
        fingerprint
    }
});

export const cancelDecrypt = (fingerprint) => ({
    type: ACTIONS.KEY_CANCELLED,
    payload: fingerprint
});

export const filesSelected = (files) => ({
    type: ACTIONS.SELECT_FILES,
    payload: files
});

const getNextState = (keys = []) => {
    const keyToDecrypt = keys.find(({ decryptedPrivateKey }) => !decryptedPrivateKey);
    return {
        keyToDecrypt,
        done: keys.length && !keyToDecrypt
    }
};

export const getInitialState = (keys = []) => {
    const uniqueKeys = uniqueBy(keys, ({ info: { fingerprints: [fingerprint]}}) => fingerprint);
    return {
        keys: uniqueKeys,
        ...getNextState(uniqueKeys)
    }
};

export default (state, { type, payload }) => {
    if (type === ACTIONS.SELECT_FILES) {
        return getInitialState(payload);
    }

    if (type === ACTIONS.KEY_DECRYPTED) {
        const { fingerprint, decryptedPrivateKey } = payload;

        const keys = state.keys.map((key) =>
            (key.info.fingerprints[0] === fingerprint)
                ? { ...key, decryptedPrivateKey: decryptedPrivateKey }
                : key
        );

        return {
            keys,
            ...getNextState(keys)
        }
    }

    if (type === ACTIONS.KEY_CANCELLED) {
        const targetFingerprint = payload;
        const keys = state.keys.filter(({ info: { fingerprints: [fingerprint]}}) => (fingerprint !== targetFingerprint));
        return {
            keys,
            ...getNextState(keys)
        }
    }
};
