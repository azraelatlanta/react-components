export const ACTIONS = {
    SELECT_ADDRESS: 1,
    SELECT_FILES: 2
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
    if (type === ACTIONS.SELECT_ADDRESS) {
        return {
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

