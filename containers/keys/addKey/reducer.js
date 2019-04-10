export const ACTIONS = {
    SELECT_ADDRESS: 1,
    SELECT_ENCRYPTION: 2,
    WARNED: 3,
    GENERATE: 4,
    ADD: 5,
    RESET: 10
};

export const getInitialState = ({ Addresses, addressesKeys }) => {
    if (Addresses.length === 1) {
        const address = Addresses[0];
        return {
            address,
            addressKeys: Object.values(addressesKeys[address.ID])
        }
    }
    return {
        Addresses,
        addressesKeys
    }
};

export const reducer = (state, { type, payload }) => {
    if (type === ACTIONS.SELECT_ADDRESS) {
        const address = payload;
        return {
            address,
            addressKeys: Object.values(state.addressesKeys[address.ID])
        }
    }

    if (type === ACTIONS.SELECT_ENCRYPTION) {
        return {
            ...state,
            encryptionConfig: payload
        }
    }

    if (type === ACTIONS.WARNED) {
        return {
            ...state,
            warned: true,
            generating: true
        }
    }

    if (type === ACTIONS.GENERATE) {
        return {
            ...state,
            generating: false,
            generatedKeys: payload
        }
    }
};

