import { uniqueBy } from 'proton-shared/lib/helpers/array';

export const ACTIONS = {
    SELECT_FILES: 1,
    KEY_DECRYPTED: 2,
    KEY_DECRYPTED_MAIN: 3,
    KEY_ERROR: 4,
    KEY_CANCELLED: 5,
};

export const keyDecryptedMain = ({ decryptedPrivateKey, info }) => ({
    type: ACTIONS.KEY_DECRYPTED_MAIN,
    payload: {
        decryptedPrivateKey,
        info
    }
});

export const keyDecrypted = ({ decryptedPrivateKey, fingerprint }) => ({
    type: ACTIONS.KEY_DECRYPTED,
    payload: {
        decryptedPrivateKey,
        fingerprint
    }
});

export const keyError = (error) => ({
    type: ACTIONS.KEY_ERROR,
    payload: error
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
    const keyToDecryptIndex = keys.length ? keys.findIndex(({ decryptedPrivateKey }) => !decryptedPrivateKey) : undefined;
    return {
        keyToDecryptIndex,
        done: keys.length && keyToDecryptIndex === -1
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

    if (type === ACTIONS.KEY_DECRYPTED_MAIN) {
        const { info, decryptedPrivateKey } = payload;

        const keys = [{ decryptedPrivateKey, info }];
        return {
            keys,
            ...getNextState(keys)
        }
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

    if (type === ACTIONS.KEY_ERROR) {
        return {
            ...state,
            error: payload,
            // Force a new state to trigger refresh in case the error is the same
            errorCounter: state.errorCounter ? state.errorCounter + 1 : 1
        }
    }

    if (type === ACTIONS.KEY_CANCELLED) {
        const targetFingerprint = payload;
        const keys = state.keys.filter(({ info: { fingerprint: [fingerprint]}}) => (fingerprint !== targetFingerprint));
        return {
            keys,
            ...getNextState(keys)
        }
    }
};
