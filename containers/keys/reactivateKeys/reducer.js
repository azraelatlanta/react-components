import { STATUS } from './ReactivateKeysList';

const ACTION_TYPES = {
    PASSWORD: 0,
    UPLOAD: 1,
    REACTIVATE_BY_PASSWORD: 2,
    REACTIVATE_BY_UPLOAD: 3,
    KEY_UPLOADED: 4,
    KEY_RESULT: 5
};

export const gotoPasswordAction = () => {
    return { type: ACTION_TYPES.PASSWORD };
};

export const gotoUploadAction = () => {
    return { type: ACTION_TYPES.UPLOAD };
};

export const gotoReactivateByPassword = (password, keySalts) => {
    return { type: ACTION_TYPES.REACTIVATE_BY_PASSWORD, password, keySalts };
};

export const gotoReactivateByUpload = () => {
    return { type: ACTION_TYPES.REACTIVATE_BY_UPLOAD };
};

export const onKeyUploaded = (fingerprint, decryptedPrivateKey) => {
    return {
        type: ACTION_TYPES.KEY_UPLOADED,
        decryptedPrivateKey,
        fingerprint
    };
};

export const keyResultAction = (key, status, result) => {
    return {
        type: ACTION_TYPES.KEY_RESULT,
        key,
        result,
        status
    };
};

export const updateKeys = (state, cb) => {
    return {
        ...state,
        allToReactivate: state.allToReactivate.map((value) => {
            const { keys } = value;
            return {
                ...value,
                keys: keys.map(cb)
            };
        })
    };
};

const getReactivate = (allToReactivate) => {
    if (allToReactivate.length === 0) {
        return {
            isDone: true
        }
    }

    // Find the first item where there is a key that does not have a result
    const toReactivate = allToReactivate.find(({ keys }) => {
        return keys.some(({ result }) => !result);
    });

    if (!toReactivate) {
        return {
            isDone: true
        }
    }

    const key = toReactivate.keys.find(({ result }) => !result);

    return {
        toReactivate,
        key,
        isDone: false
    };
};


export const reducer = (state, action) => {
    if (action.type === ACTION_TYPES.PASSWORD) {
        return {
            ...state,
            step: 2
        };
    }

    if (action.type === ACTION_TYPES.UPLOAD) {
        return {
            ...state,
            step: 1
        };
    }

    // Set the new key that has been uploaded.
    if (action.type === ACTION_TYPES.KEY_UPLOADED) {
        const { fingerprint: searchedFingerprint, decryptedPrivateKey } = action;

        return updateKeys(state, (key) => {
            const { info: { fingerprints: [fingerprint] } } = key;

            if (fingerprint !== searchedFingerprint) {
                return key;
            }

            return {
                ...key,
                decryptedPrivateKey,
                status: STATUS.UPLOADED
            };
        });
    }

    // Start the reactivation process by password.
    if (action.type === ACTION_TYPES.REACTIVATE_BY_PASSWORD) {
        if (!action.password || !action.keySalts) {
            return;
        }

        return {
            ...state,
            step: 3,
            password: action.password,
            keySalts: action.keySalts,
            mode: 'password',

            ...getReactivate(state.allToReactivate)
        };
    }

    // Start the reactivation process by using uploaded keys. Removes all keys that have not been uploaded.
    if (action.type === ACTION_TYPES.REACTIVATE_BY_UPLOAD) {
        const onlyUploadedToReactivate = state.allToReactivate.map((value) => {
            const { keys } = value;
            const uploadedKeys = keys.filter((key) => !!key.decryptedPrivateKey);
            if (!uploadedKeys.length) {
                return;
            }
            return {
                ...value,
                keys: uploadedKeys
            };
        }).filter(Boolean);

        return {
            ...state,
            step: 3,
            mode: 'upload',
            allToReactivate: onlyUploadedToReactivate,
            ...getReactivate(onlyUploadedToReactivate)
        };
    }

    // Update the current key being processed with a new result, and check the done state.
    if (action.type === ACTION_TYPES.KEY_RESULT) {
        const { status, result, key: targetKey } = action;

        const allToReactivate = state.allToReactivate.map((value) => {
            const { keys } = value;

            const keyIndex = keys.findIndex((key) => key === targetKey);

            if (keyIndex === -1) {
                return value;
            }

            const newKeys = keys.map((key) => {
                if (key !== targetKey) {
                    return key;
                }
                return {
                    ...key,
                    status,
                    result
                };
            });

            return {
                ...value,
                keys: newKeys
            };
        });

        return {
            ...state,
            allToReactivate,
            ...getReactivate(allToReactivate)
        };
    }

    return state;
};
