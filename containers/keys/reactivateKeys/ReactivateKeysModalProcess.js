import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Alert,
    PrimaryButton,
    Label,
    PasswordInput,
    useKeySalts,
} from 'react-components';

import ReactivateKeysList, { STATUS, convertStatus } from './ReactivateKeysList';
import RenderModal from '../shared/RenderModal';
import { decrypt } from '../shared/DecryptKey';

const getState = (addressesKeysToReactivate, resultMap, defaultStatus = STATUS.LOADING) => {
    return addressesKeysToReactivate.reduce((acc, value) => {
        const { Address, User, keys } = value;
        const addressID = Address ? Address.ID : User.ID;
        const results = resultMap[addressID] || {};
        return acc.concat(keys.map(({ info }) => {
            const [fingerprint] = info.fingerprints;
            return {
                email: User ? User.Name : Address.Email,
                fingerprint,
                ...convertStatus(results[fingerprint], defaultStatus)
            }
        }));
    }, []);
};

const ReactivateKeysModalProcess = ({ reactivateKeys, addressesKeysToReactivate, onSuccess, onClose }) => {
    const [keySalts = [], loading, error] = useKeySalts();
    const [step, setStep] = useState(0);
    const [password, setPassword] = useState('');
    const [processState, setProcessState] = useState(() => getState(addressesKeysToReactivate, {}, STATUS.INACTIVE));
    const [done, setDone] = useState(false);

    // If fetching key salts failed close the modal
    useEffect(() => {
        if (!loading && error) {
            onClose();
        }
    }, [loading, error]);

    const info = (
        <Alert>
            {c('Info').t`If a key remains inactive, it means that the decryption password provided does not apply to the key.`}
        </Alert>
    );

    const handleDecryptKey = async ({ ID: keyID, PrivateKey: armoredPrivateKey }) => {
        const { KeySalt: keySalt } = keySalts.find(({ ID }) => ID === keyID) || {};
        return decrypt({
            armoredPrivateKey,
            keySalt,
            password
        });
    };

    const startProcess = async () => {
        const resultMap = {};
        setProcessState(getState(addressesKeysToReactivate, resultMap));

        for (const { User, Address, keys } of addressesKeysToReactivate) {
            const maybeDecryptedKeys = await Promise.all(keys.map(({ Key }) => handleDecryptKey(Key)
                .then((key) => [key, undefined])
                .catch((e) => [undefined, e]))
            );
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
            resultMap[addressID] = {
                ...reactivationResults,
                ...decryptionErrorResults
            };
            setProcessState(getState(addressesKeysToReactivate, resultMap));
        }

        setDone(true);
    };

    const handlePasswordChange = ({ target }) => setPassword(target.value);
    const passwordId = 'password';
    const passwordLabel = c('Label').t`Enter your previous password from before your account was reset:`;
    const passwordInput = (
        <>
            <Label htmlFor={passwordId}>{passwordLabel}</Label>
            <PasswordInput id={passwordId} value={password} onChange={handlePasswordChange} autoFocus={true} required/>
        </>
    );

    const currentStep = loading ? ({
        title: c('Title').t`Loading`,
        container: 'Loading...'
    }) : [
        () => ({
            title: c('Title').t`Re-activate keys`,
            container: <ReactivateKeysList keys={processState}/>,
            submit: c('Action').t`Re-activate`,
            onSubmit: () => setStep(1),
        }),
        () => ({
            title: c('Title').t`Enter password to continue`,
            container: passwordInput,
            submit: c('Action').t`Submit`,
            onSubmit: () => {
                setStep(2);
                startProcess();
            }
        }),
        () => ({
            title: c('Title').t`Key Activation`,
            container: <><ReactivateKeysList keys={processState}/>{info}</>,
            submit: (<PrimaryButton type="submit" disabled={!done}>{c('Action').t`Done`}</PrimaryButton>),
            onSubmit: onSuccess
        }),
    ][step]();

    const close = c('Action').t`Close`;

    return <RenderModal onClose={onClose} close={close} {...currentStep}/>;
};

ReactivateKeysModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    reactivateKeys: PropTypes.func.isRequired,
    addressesKeysToReactivate: PropTypes.array.isRequired
};

export default ReactivateKeysModalProcess;
