export const ACTIONS = {
    WARNED: 1,
    SELECT_ADDRESS: 2,
    SELECT_FILES: 3
};

export const getInitialState = ({ Addresses }) => {
    if (Addresses.length === 1) {
        return {
            address: Addresses[0],
        }
    }
    return {}
};

export const reducer = (state, { type, payload }) => {
    if (type === ACTIONS.WARNED) {
        return {
            warned: true,
            ...state
        }
    }

    if (type === ACTIONS.SELECT_ADDRESS) {
        return {
            ...state,
            address: payload.address,
            addressKeys: payload.addressKeys
        }
    }

    if (type === ACTIONS.SELECT_FILES) {
        return {
            ...state,
            files: payload
        }
    }
};

