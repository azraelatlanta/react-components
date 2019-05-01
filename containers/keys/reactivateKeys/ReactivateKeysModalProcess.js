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
    useAuthenticationStore,
    useEventManager
} from 'react-components';
import { getKeySalts } from 'proton-shared/lib/api/keys';

import ReactivateKeysList, { STATUS } from './ReactivateKeysList';
import RenderModal from '../shared/RenderModal';
import DecryptFileKeyModal, { decrypt } from '../shared/DecryptFileKeyModal';
import createKeysManager from 'proton-shared/lib/keys/keysManager';

import {
    reducer,
    gotoReactivateByPassword,
    gotoReactivateByUpload,
    gotoUploadAction,
    gotoPasswordAction,
    keyResultAction,
    onKeyUploaded
} from './reducer';

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

    const allToReactivate = addressesKeysToReactivate.map(({ User, Address, inactiveKeys, allKeys }) => {
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
        allToReactivate
    };
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
    const { call } = useEventManager();

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

    const {
        step,
        isDone,
        allToReactivate,
        mode,
        keySalts
    } = state;

    const startProcess = async () => {
        const newPassword = authenticationStore.getPassword();
        const oldPassword = password;

        for (const { User, Address, allKeys, keys } of allToReactivate) {
            const keysManager = createKeysManager(allKeys);

            for (const key of keys) {
                try {
                    const decryptedPrivateKey = mode === 'upload' ? key.decryptedPrivateKey : await tryDecryptKey(keySalts, key.Key, oldPassword);

                    await keysManager.reactivateKey({
                        Address,
                        User,
                        password: newPassword,
                        oldDecryptedPrivateKey: decryptedPrivateKey,
                        api
                    });

                    // Trigger the event manager, but no need to wait because we keep local state.
                    call();

                    dispatch(keyResultAction(key.Key.ID, STATUS.SUCCESS, 'ok'));
                } catch (e) {
                    dispatch(keyResultAction(key.Key.ID, STATUS.ERROR, e));
                }
            }
        }
    };

    useEffect(() => {
        if (step !== 3) {
            return;
        }
        startProcess();
    }, [step]);

    const currentStep = (() => {
        if (step === 0) {
            return {
                title: c('Title').t`Re-activate keys`,
                container: (
                    <IntroStep onUpload={() => dispatch(gotoUploadAction())}>
                        <ReactivateKeysList allToReactivate={allToReactivate}/>
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
                        <ReactivateKeysList allToReactivate={allToReactivate} onUpload={handleUpload} onError={handleError}/>
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
            if (allToReactivate.length === 0 && isDone) {
                onClose();
            }

            return {
                title: c('Title').t`Re-activate keys`,
                container: (
                    <>
                        <ReactivateKeysList loading={!isDone} allToReactivate={allToReactivate}/>
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
