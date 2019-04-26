import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    useApi,
    Alert,
    PrimaryButton,
    Field,
    Label,
    PasswordInput,
    useNotifications
} from 'react-components';
import { getKeySalts } from 'proton-shared/lib/api/keys';

import ReactivateKeysList, { STATUS, convertStatus } from './ReactivateKeysList';
import RenderModal from '../shared/RenderModal';
import DecryptFileKeyModal, { decrypt } from '../shared/DecryptFileKeyModal';
import { createDecryptionError } from '../shared/DecryptionError';

const getState = ({ addressesKeysToReactivate, resultMap = {}, uploadedMap = {}, status }) => {
    return addressesKeysToReactivate.reduce((acc, value) => {
        const { Address, User, keys } = value;
        const addressID = Address ? Address.ID : User.ID;
        const results = resultMap[addressID] || {};
        return acc.concat(keys.map(({ info }) => {
            const [fingerprint] = info.fingerprints;
            return {
                email: User ? User.Name : Address.Email,
                fingerprint,
                isUploaded: !!uploadedMap[fingerprint],
                ...convertStatus(results[fingerprint], status)
            }
        }));
    }, []);
};

const IntroStep = ({ children, onUpload }) => {
    const uploadButton = (<a onClick={onUpload}>{c('Info').jt`uploading a backup key`}</a>);

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
                    onChange={({ target: { value }}) => setPassword(value)}
                    autoFocus={true}
                    required
                />
            </Field>
        </>
    );
};

const ReactivateKeysModalProcess = ({ reactivateKeys, addressesKeysToReactivate, onSuccess, onClose }) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [step, setStep] = useState(0);
    const [processState, setProcessState] = useState(() => getState({ addressesKeysToReactivate, status: STATUS.INACTIVE }));
    const [done, setDone] = useState(false);
    const [uploadedMap, setUploadedMap] = useState({});
    const [resultMap, setResultMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null);
    const [password, setPassword] = useState();

    const handleError = (error) => {
        createNotification({ type: 'error', text: error });
        console.error(error)
    };

    const startProcess = async (mode) => {
        let processResultMap = {};

        setResultMap(processResultMap);
        setLoading(true);

        // TODO: USE THE UPLOADED MAP
        const keySalts = mode === 'password' ? await api(getKeySalts()).then(({ KeySalts }) => KeySalts) : {};

        const handleDecryptKey = ({ Key, info }) => {
            // For the backup mode we only care about the keys which have been uploaded.
            if (mode === 'backup') {
                const backupDecryptedKey = uploadedMap[info.fingerprints[0]];
                if (!backupDecryptedKey) {
                    return [undefined, createDecryptionError()];
                }
                return [backupDecryptedKey, undefined];
            }

            const { ID: keyID, PrivateKey } = Key;
            const { KeySalt: keySalt } = keySalts.find(({ ID }) => ID === keyID) || {};

            return decrypt({ armoredPrivateKey: PrivateKey, keySalt, password })
                .then((key) => [key, undefined])
                .catch((e) => [undefined, e])
        };

        for (const { User, Address, keys } of addressesKeysToReactivate) {
            const maybeDecryptedKeys = await Promise.all(keys.map(handleDecryptKey));

            const [decryptedKeys, decryptionErrorResults] = keys.reduce((acc, { info }, i) => {
                const [fingerprint] = info.fingerprints;
                const [decryptedPrivateKey, error] = maybeDecryptedKeys[i];

                const value = error ? error : decryptedPrivateKey;
                const idx = error ? 1 : 0;

                acc[idx][fingerprint] = value;

                return acc;
            }, [{}, {}]);

            const reactivationResults = await reactivateKeys({ User, Address, decryptedKeys });

            const addressID = Address ? Address.ID : User.ID;
            processResultMap = {
                ...processResultMap,
                [addressID]: {
                    ...reactivationResults,
                    ...decryptionErrorResults
                }
            };
            setResultMap(processResultMap);
        }

        setLoading(false);
        setDone(true);
    };


    useEffect(() => {
        setProcessState(getState({
            addressesKeysToReactivate,
            resultMap,
            uploadedMap,
            status: loading ? STATUS.LOADING : STATUS.INACTIVE
        }));
    }, [resultMap, uploadedMap]);

    const currentStep = (() => {
        const handleDecryptedUploadedKey = ({ info, decryptedPrivateKey }) => {
            const [fingerprint] = info.fingerprints;

            setUploadedMap({
                ...uploadedMap,
                [fingerprint]: decryptedPrivateKey
            });
        };

        if (step === 0) {
            return {
                title: c('Title').t`Re-activate keys`,
                container: (
                    <IntroStep onUpload={() => setStep(1)}>
                        <ReactivateKeysList keys={processState}/>
                    </IntroStep>
                ),
                submit: c('Action').t`Re-activate`,
                onSubmit: () => setStep(2),
            }
        }

        if (step === 1) {
            const handleUpload = ({ info, armoredPrivateKey, decryptedPrivateKey }) => {
                if (!decryptedPrivateKey) {
                    const [fingerprint] = info.fingerprints;

                    return setModal(
                        <DecryptFileKeyModal
                            fingerprint={fingerprint}
                            armoredPrivateKey={armoredPrivateKey}
                            onSuccess={(decryptedPrivateKey) => {
                                handleDecryptedUploadedKey({ info, decryptedPrivateKey });
                                setModal();
                            }}
                            onClose={() => {
                                setModal()
                            }}
                        />
                    );
                }
                return handleDecryptedUploadedKey({ info, decryptedPrivateKey });
            };

            return {
                title: c('Title').t`Upload backup keys`,
                container: (
                    <UploadStep>
                        <ReactivateKeysList keys={processState} onUpload={handleUpload} onError={handleError}/>
                    </UploadStep>
                ),
                submit: c('Action').t`Re-activate`,
                onSubmit: () => {
                    setStep(3);
                    startProcess('backup');
                },
            }
        }

        if (step === 2) {
            return {
                title: c('Title').t`Enter password to continue`,
                container: <OldPasswordStep password={password} setPassword={setPassword}/>,
                submit: c('Action').t`Submit`,
                onSubmit: () => {
                    setStep(3);
                    startProcess('password');
                }
            }
        }

        if (step === 3) {
            const info = (
                <Alert>
                    {c('Info').t`If a key remains inactive, it means that the decryption password provided does not apply to the key.`}
                </Alert>
            );

            return {
                title: c('Title').t`Re-activate keys`,
                container: (
                    <>
                        <ReactivateKeysList keys={processState}/>
                        {info}
                    </>
                ),
                submit: (
                    <PrimaryButton type="submit" disabled={!done}>
                        {c('Action').t`Done`}
                    </PrimaryButton>),
                onSubmit: onSuccess
            }
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
    reactivateKeys: PropTypes.func.isRequired,
    addressesKeysToReactivate: PropTypes.array.isRequired
};

export default ReactivateKeysModalProcess;
