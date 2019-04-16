import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import {
    useAuthenticationStore,
    useNotifications,
    useKeySalts
} from 'react-components';

import RenderModal from '../shared/RenderModal';
import useDecryptOrUploadStep from './useDecryptOrUploadStep';

const ReactivateKeyModalProcess = ({ keyInfo, keyData, onClose, onSuccess }) => {
    const [{ step, key }, setState] = useState({ step: 0 });
    const [keySalts = [], loading] = useKeySalts();
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();
    const decryptOrUploadStep = useDecryptOrUploadStep({
        keySalts,
        keyInfo,
        keyData,
    });

    const generate = () => setTimeout(() => {
        //await call();
        console.log(key);
        createNotification({
            text: c('Success').t`Key reactivated`,
            type: 'success'
        });
        onSuccess();
    }, 1500);

    useEffect(() => {
        if (step === 1) {
            generate();
        }
    }, [step]);

    const handleSuccess = (key) => {
        setState({ step: 1, key });
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
    keyData: PropTypes.object.isRequired,
    keyInfo: PropTypes.object.isRequired
};

export default ReactivateKeyModalProcess;
