export const ACTIONS = {
    SELECT_ADDRESS: 1,
    SELECT_ENCRYPTION: 2,
    WARN: 3,
    GENERATE: 4,
    ADD: 5,
    RESET: 10
};

export const getInitialState = (Addresses) => {
    if (Addresses.length === 1) {
        const address = Addresses[0];
        return {
            address,
            step: ACTIONS.SELECT_ENCRYPTION
        }
    }
    return {
        step: ACTIONS.SELECT_ADDRESS
    }
};

export const reducer = (state, { type, payload }) => {
    if (type === ACTIONS.SELECT_ADDRESS) {
        return {
            address: payload,
            step: ACTIONS.SELECT_ENCRYPTION
        }
    }

    if (type === ACTIONS.SELECT_ENCRYPTION) {
        const { encryptionConfig, exists } = payload;
        return {
            ...state,
            encryptionConfig,
            step: !exists ? ACTIONS.GENERATE : ACTIONS.WARN
        }
    }

    if (type === ACTIONS.WARN) {
        return {
            ...state,
            step: ACTIONS.GENERATE
        }
    }

    if (type === ACTIONS.GENERATE) {
        return {
            ...state,
            generatedKeys: payload,
            step: ACTIONS.GENERATE
        }
    }
};

