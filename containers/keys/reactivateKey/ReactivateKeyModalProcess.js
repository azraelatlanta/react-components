import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { reactivateKey } from 'proton-shared/lib/api/keys';
import {
    useAuthenticationStore,
    useNotifications,
    useKeySalts,
    useApi,
    useEventManager
} from 'react-components';
import { encryptPrivateKey } from 'pmcrypto';

import RenderModal from '../shared/RenderModal';
import useDecryptOrUploadStep from './useDecryptOrUploadStep';

const ReactivateKeyModalProcess = ({ isAddressKey, keysMap, keyInfo, keyData, onClose, onSuccess }) => {
    const [{ step, decryptedPrivateKey }, setState] = useState({ step: 0 });
    const api = useApi();
    const { call } = useEventManager();
    const [keySalts = [], loading] = useKeySalts();
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();
    const decryptOrUploadStep = useDecryptOrUploadStep({
        keySalts,
        keyInfo,
        keyData,
    });

    const getSignedKeyList = () => {
        if (!isAddressKey) {
            return;
        }

        const newKeysList = keysReducer(keysMap, reactivateKey({
            decryptedPrivateKey,
            fingerprint: keyInfo.fingerprints[0],
            address
        }));

        return generateSignedKeyList(newKeysList);
    };

    const generate = async () => {
        try {
            const password = authenticationStore.getPassword();
            if (!decryptedPrivateKey || !password) {
                throw new Error('Missing private key or password');
            }

            console.log(decryptedPrivateKey);

            const encryptedPrivateKey = await encryptPrivateKey(decryptedPrivateKey, password);
            const signedKeyList = await getSignedKeyList();

            await api(reactivateKey({
                KeyID: keyData.ID,
                PrivateKey: encryptedPrivateKey,
                SignedKeyList: signedKeyList
            }));

            await call();

            createNotification({
                text: c('Success').t`Key reactivated`,
                type: 'success'
            });

            onSuccess();
        } catch (e) {
            console.log(e);
            onClose();
        }
    };

    useEffect(() => {
        if (step === 1) {
            generate();
        }
    }, [step]);

    const handleSuccess = (decryptedPrivateKey) => {
        setState({ step: 1, decryptedPrivateKey });
    };

    const handleError = (text) => {
        createNotification({ type: 'error', text })
    };

    const currentStep = loading ? ({
        title: c('Title').t`Loading`,
        container: 'Loading...'
    }) : [
        () => decryptOrUploadStep(handleSuccess, handleError),
        () => ({
            title: c('Title').t`Reactivating key (${keyInfo.fingerprint})`,
            container:(<div>Loading...</div>),
            close: undefined
        })
    ][step]();

    const close = c('Action').t`Close`;

    return <RenderModal onClose={onClose} close={close} {...currentStep}/>;
};

ReactivateKeyModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    isAddressKey: PropTypes.bool.isRequired,
    keysMap: PropTypes.object.isRequired,
    keyData: PropTypes.object.isRequired,
    keyInfo: PropTypes.object.isRequired
};

export default ReactivateKeyModalProcess;
