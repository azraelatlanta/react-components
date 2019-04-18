export const ACTIONS = {
    SELECT_FILES: 1,
    KEY_DECRYPTED: 2,
    KEY_ERROR: 3,
    KEY_CANCELLED: 4,
};

export const onDecrypt = ({ decryptedPrivateKey, fingerprint }) => ({
    type: ACTIONS.KEY_DECRYPTED,
    payload: {
        decryptedPrivateKey,
        fingerprint
    }
});

export const onCancelDecrypt = (fingerprint) => ({
    type: ACTIONS.KEY_CANCELLED,
    payload: fingerprint
});

export const onFiles = (files) => ({
    type: ACTIONS.SELECT_FILES,
    payload: files
});

const getNextState = (keys = []) => {
    const keyToDecrypt = keys.length ? keys.find(({ decryptedPrivateKey }) => !decryptedPrivateKey) : undefined;
    return {
        keyToDecrypt,
        done: keys.length && !keyToDecrypt
    }
};

export const getInitialState = (keys = []) => {
    return {
        keys,
        ...getNextState(keys)
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

    if (type === ACTIONS.KEY_ERROR) {
        return {
            ...state,
            error: payload
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
