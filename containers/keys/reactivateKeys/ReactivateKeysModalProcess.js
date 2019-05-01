import React, { useRef, useState, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    useApi,
    Alert,
    PrimaryButton,
    Field,
    Label,
    PasswordInput,
    useNotifications,
    useAuthenticationStore
} from 'react-components';
import { getKeySalts } from 'proton-shared/lib/api/keys';

import ReactivateKeysList, { STATUS, convertStatus } from './ReactivateKeysList';
import RenderModal from '../shared/RenderModal';
import DecryptFileKeyModal, { decrypt } from '../shared/DecryptFileKeyModal';
import { createDecryptionError } from '../shared/DecryptionError';
import createKeysManager from 'proton-shared/lib/keys/keysManager';

const IntroStep = ({ children, onUpload }) => {
    const uploadButton = (<a key="0" onClick={onUpload}>{c('Info').t`uploading a backup key`}</a>);

    return (
        <>
            <Alert>
                {c('Info').t`To reactivate keys, you will be prompted to enter your previous login password from before your account was reset`}
            </Alert>
            {children}
            <Alert>
                {c('Info').jt`You can also reactivate your keys by ${uploadButton}`}
            </Alert>
        </>
    );
};

const UploadStep = ({ children }) => {
    return (
        <>
            <Alert>
                {c('Info').t`If the backup key has been encrypted, you will be prompted to enter the password to decrypt it`}
            </Alert>
            {children}
        </>
    );
};

const OldPasswordStep = ({ password, setPassword }) => {
    const passwordId = 'password';
    const passwordLabel = c('Label').t`Enter your previous password from before your account was reset:`;
    return (
        <>
            <Label htmlFor={passwordId}>{passwordLabel}</Label>
            <Field>
                <PasswordInput
                    id={passwordId}
                    value={password}
                    onChange={({ target: { value } }) => setPassword(value)}
                    autoFocus={true}
                    required
                />
            </Field>
        </>
    );
};

const getInitialState = (addressesKeysToReactivate) => {
    if (addressesKeysToReactivate.length === 0) {
        throw new Error('Keys to reactivate needed');
    }

    const toReactivate = addressesKeysToReactivate.map(({ User, Address, inactiveKeys, allKeys }) => {
        if (inactiveKeys.length === 0) {
            throw new Error('Keys to reactivate needed');
        }
        if (!User && !Address) {
            throw new Error('User or address needed');
        }
        return {
            User,
            Address,
            keys: inactiveKeys.map((key) => ({ ...key, status: STATUS.INACTIVE })),
            allKeys
        };
    });

    return {
        step: 0,
        toReactivate
    };
};

const ACTION_TYPES = {
    PASSWORD: 0,
    UPLOAD: 1,
    REACTIVATE_BY_PASSWORD: 2,
    REACTIVATE_BY_UPLOAD: 3,
    KEY_UPLOADED: 4,
    KEY_RESULT: 5
};

const gotoPasswordAction = () => {
    return { type: ACTION_TYPES.PASSWORD };
};

const gotoUploadAction = () => {
    return { type: ACTION_TYPES.UPLOAD };
};

const gotoReactivateByPassword = (password, keySalts) => {
    return { type: ACTION_TYPES.REACTIVATE_BY_PASSWORD, password, keySalts };
};

const gotoReactivateByUpload = () => {
    return { type: ACTION_TYPES.REACTIVATE_BY_UPLOAD };
};

const onKeyUploaded = (fingerprint, decryptedPrivateKey) => {
    return {
        type: ACTION_TYPES.KEY_UPLOADED,
        decryptedPrivateKey,
        fingerprint
    };
};

const keyResultAction = (status, result) => {
    return {
        type: ACTION_TYPES.KEY_RESULT,
        result,
        status
    };
};

const updateKeys = (state, cb) => {
    return {
        ...state,
        toReactivate: state.toReactivate.map((value) => {
            const { keys } = value;
            return {
                ...value,
                keys: keys.map(cb)
            };
        })
    };
};

const reducer = (state, action) => {
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

            addressIndex: 0,
            keyIndex: 0
        };
    }

    if (action.type === ACTION_TYPES.REACTIVATE_BY_UPLOAD) {
        const onlyUploadedToReactivate = state.toReactivate.map((value) => {
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

        if (onlyUploadedToReactivate.length === 0) {
            return {
                ...state,
                step: 3,
                isDone: true,
                toReactivate: onlyUploadedToReactivate,
            }
        }

        return {
            ...state,
            step: 3,
            mode: 'upload',
            toReactivate: onlyUploadedToReactivate,
            addressIndex: 0,
            keyIndex: 0
        };
    }

    if (action.type === ACTION_TYPES.KEY_RESULT) {
        const { addressIndex, keyIndex } = state;
        const { status, result } = action;

        const toReactivate = state.toReactivate.map((value, i) => {
            if (i !== addressIndex) {
                return value;
            }

            const { keys } = value;

            const newKeys = keys.map((key, j) => {
                if (j !== keyIndex) {
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
                keys: newKeys,
                isDone: keyIndex === newKeys.length - 1
            };
        });

        const isAddressDone = toReactivate[addressIndex].isDone;
        const isDone = isAddressDone && addressIndex === toReactivate.length - 1;

        if (isDone) {
            return {
                ...state,
                toReactivate,
                isDone
            }
        }

        return {
            ...state,
            toReactivate,
            addressIndex: isAddressDone ? addressIndex + 1 : addressIndex,
            keyIndex: isAddressDone ? 0 : keyIndex + 1,
            isDone
        };
    }

    return state;
};

const tryDecryptKey = async (keySalts, Key, password) => {
    const { ID: keyID, PrivateKey } = Key;
    const { KeySalt: keySalt } = keySalts.find(({ ID }) => ID === keyID) || {};
    return decrypt({ armoredPrivateKey: PrivateKey, keySalt, password });
};

const ReactivateKeysModalProcess = ({ addressesKeysToReactivate, onSuccess, onClose }) => {
    const api = useApi();
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();
    const keysManagerRef = useRef({});
    const [loadingKeySalts, setLoadingKeySalts] = useState(false);

    const [state, dispatch] = useReducer(reducer, undefined, () => getInitialState(addressesKeysToReactivate));

    const [modal, setModal] = useState(null);
    const [password, setPassword] = useState('');

    const handleError = (error) => {
        createNotification({ type: 'error', text: error });
    };

    const resetModal = () => {
        setModal();
    };

    const reactivateKey = async ({ keysManager, Address, User, key }) => {
        try {
            const { mode, keySalts } = state;
            const oldPassword = password;
            const newPassword = authenticationStore.getPassword();

            const decryptedPrivateKey = mode === 'upload' ? key.decryptedPrivateKey : await tryDecryptKey(keySalts, key.Key, oldPassword);

            await keysManager.reactivateKey({
                Address,
                User,
                password: newPassword,
                oldDecryptedPrivateKey: decryptedPrivateKey,
                api
            });

            dispatch(keyResultAction(STATUS.SUCCESS, 'ok'));
        } catch (e) {
            dispatch(keyResultAction(STATUS.ERROR, e));
        }
    };

    const { step, isDone, addressIndex, keyIndex, toReactivate } = state;

    useEffect(() => {
        if (typeof addressIndex !== 'number' || typeof keyIndex !== 'number') {
            return;
        }

        const { Address, User, keys, allKeys } = toReactivate[addressIndex];

        if (keysManagerRef.current.addressIndex !== addressIndex) {
            // While keys for the same address are being reactivated, the same keys manager needs to be used.
            keysManagerRef.current = {
                addressIndex,
                manager: createKeysManager(allKeys)
            };
        }

        const key = keys[keyIndex];

        reactivateKey({
            Address,
            User,
            key,
            keysManager: keysManagerRef.current.manager
        });
    }, [addressIndex, keyIndex]);

    const currentStep = (() => {
        if (step === 0) {
            return {
                title: c('Title').t`Re-activate keys`,
                container: (
                    <IntroStep onUpload={() => dispatch(gotoUploadAction())}>
                        <ReactivateKeysList toReactivate={toReactivate}/>
                    </IntroStep>
                ),
                submit: c('Action').t`Re-activate`,
                onSubmit: () => {
                    dispatch(gotoPasswordAction());
                }
            };
        }

        if (step === 1) {
            const handleUpload = ({ info, armoredPrivateKey, decryptedPrivateKey }) => {
                const [fingerprint] = info.fingerprints;

                if (decryptedPrivateKey) {
                    return dispatch(onKeyUploaded(fingerprint, decryptedPrivateKey));
                }

                return setModal(
                    <DecryptFileKeyModal
                        fingerprint={fingerprint}
                        armoredPrivateKey={armoredPrivateKey}
                        onSuccess={(decryptedPrivateKey) => {
                            const [fingerprint] = info.fingerprints;
                            dispatch(onKeyUploaded(fingerprint, decryptedPrivateKey));
                            resetModal();
                        }}
                        onClose={resetModal}
                    />
                );
            };

            return {
                title: c('Title').t`Upload backup keys`,
                container: (
                    <UploadStep>
                        <ReactivateKeysList toReactivate={toReactivate} onUpload={handleUpload} onError={handleError}/>
                    </UploadStep>
                ),
                submit: c('Action').t`Re-activate`,
                onSubmit: () => {
                    dispatch(gotoReactivateByUpload());
                }
            };
        }

        if (step === 2) {
            return {
                title: c('Title').t`Enter password to continue`,
                container: <OldPasswordStep password={password} setPassword={setPassword}/>,
                submit: (
                    <PrimaryButton type="submit" disabled={loadingKeySalts}>
                        {c('Action').t`Submit`}
                    </PrimaryButton>
                ),
                onSubmit: async () => {
                    try {
                        setLoadingKeySalts(true);
                        const keySalts = await api(getKeySalts()).then(({ KeySalts }) => KeySalts);
                        dispatch(gotoReactivateByPassword(password, keySalts));
                    } catch (e) {
                        setLoadingKeySalts(false);
                    }
                }
            };
        }

        if (step === 3) {
            const info = (
                <Alert>
                    {c('Info').t`If a key remains inactive, it means that the decryption password provided does not apply to the key.`}
                </Alert>
            );

            // Handles the case where you don't upload any backup key and hit done.
            if (toReactivate.length === 0 && isDone) {
                onClose();
            }

            return {
                title: c('Title').t`Re-activate keys`,
                container: (
                    <>
                        <ReactivateKeysList loading={!isDone} toReactivate={toReactivate}/>
                        {info}
                    </>
                ),
                submit: (
                    <PrimaryButton type="submit" disabled={!isDone}>
                        {c('Action').t`Done`}
                    </PrimaryButton>
                ),
                onSubmit: onSuccess
            };
        }
    })();

    const close = c('Action').t`Close`;

    return (
        <>
            <RenderModal onClose={onClose} close={close} {...currentStep}/>
            {modal}
        </>
    );
};

ReactivateKeysModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    addressesKeysToReactivate: PropTypes.array.isRequired
};

export default ReactivateKeysModalProcess;
