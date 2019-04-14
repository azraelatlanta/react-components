export const ACTIONS = {
    WARN: 1,
    SELECT_ADDRESS: 2,
    SELECT_FILES: 3,
    PROCESS: 4
};

export const getInitialState = (Addresses) => {
    if (Addresses.length === 1) {
        return {
            address: Addresses[0],
            step: ACTIONS.WARN
        }
    }
    return {
        step: ACTIONS.WARN
    }
};

export const reducer = (state, { type, payload }) => {
    if (type === ACTIONS.WARN) {
        return {
            ...state,
            step: state.address ? ACTIONS.SELECT_FILES : ACTIONS.SELECT_ADDRESS
        }
    }

    if (type === ACTIONS.SELECT_ADDRESS) {
        return {
            ...state,
            address: payload.address,
            step: ACTIONS.SELECT_FILES
        }
    }

    if (type === ACTIONS.SELECT_FILES) {
        return {
            ...state,
            files: payload,
            step: ACTIONS.PROCESS
        }
    }
};

