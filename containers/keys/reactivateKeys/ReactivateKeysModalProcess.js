import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    useAuthenticationStore,
    useNotifications,
    Info,
    PrimaryButton,
    Label,
    PasswordInput,
    useKeySalts,
} from 'react-components';

import ReactivateKeysList, { STATUS } from './ReactivateKeysList';
import RenderModal from '../shared/RenderModal';

const getAddressKeys = ({ Address, User, keys }, status) => {
    return keys.map(({ info }) => {
        return {
            email: User ? User.Name : Address.Email,
            fingerprint: info.fingerprints[0],
            status
        }
    });
};

const getStatus = (keyResult) => {
    if (keyResult instanceof Error) {
        return {
            error: keyResult.name,
            status: STATUS.ERROR
        };
    }
    return {
        status: STATUS.SUCCESS
    }
};

const getState = (addressesKeysToReactivate, allResults, status = STATUS.LOADING) => {
    return addressesKeysToReactivate.reduce((acc, value, i) => {
        const results = allResults[i];

        const addressKeys = getAddressKeys(value, status);
        if (!results) {
            return addressKeys;
        }

        return addressKeys.map((key, j) => {
            return {
                ...key,
                ...getStatus(results[j])
            }
        });
    }, []);
};

const ReactivateKeysModalProcess = ({ reactivateKeys, addressesKeysToReactivate, onSuccess, onClose }) => {
    const [keySalts = [], loading] = useKeySalts();
    const [step, setStep] = useState(0);
    const [password, setPassword] = useState('');
    const [processState, setProcessState] = useState(() => getState(addressesKeysToReactivate, [], STATUS.INACTIVE));
    const [done, setDone] = useState(false);

    const info = (
        <Info>
            {c('Info').t`If a key remains inactive, it means that the decryption password provided does not apply to the key.`}
        </Info>
    );

    const handleDecryptKey = async ({ Key }) => {
        const { ID: keyID, PrivateKey: armoredPrivateKey } = Key;
        const { KeySalt: keySalt } = keySalts.find(({ ID }) => ID === keyID) || {};
        return decrypt({
            armoredPrivateKey,
            keySalt,
            password
        }).catch(() => {});
    };

    const startProcess = async () => {
        const allResults = [];

        setProcessState(getState(addressesKeysToReactivate, allResults));

        for (const { Address, keys } of addressesKeysToReactivate) {
            const decryptedKeys = await Promise.all(keys.map(handleDecryptKey));
            const results = await reactivateKeys({ Address, decryptedKeys });
            allResults.push(results);
            setProcessState(getState(addressesKeysToReactivate, allResults));
        }

        setDone(true);
    };

    const handleDone = () => {
        if (!done) {
            return;
        }
        onSuccess();
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
            onSubmit: handleDone
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
