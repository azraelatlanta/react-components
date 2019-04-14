import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { useAuthenticationStore, useNotifications, useKeySalts } from 'react-components';

import ReactivateKeyModal from './ReactivateKeyModal';

const ReactivateKeyModalProcess = ({ keyInfo, keyData, onClose, onSuccess }) => {
    const [state, setState] = useState({});
    const [keySalts, loading] = useKeySalts();
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();

    const handleCancel = () => onClose();

    const {
        decryptedPrivateKey,
    } = state;

    if (loading) {
        return (
            <LoadingModal
                key={2}
                title={c('Title').t`Loading`}
                onClose={() => {}}
            />
        )
    }

    if (!decryptedPrivateKey) {
        const { KeySalt } = keySalts.find(({ ID }) => ID === keyData.ID);
        return (
            <ReactivateKeyModal
                keyInfo={keyInfo}
                keyData={keyData}
                keySalt={KeySalt}
                onSuccess={(decryptedPrivateKey) => {
                    setState({ decryptedPrivateKey });
                }}
                onClose={handleCancel}
            />
        )
    }

    const generate = () => new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
            //await call();
            createNotification({
                text: c('Success').t`Key reactivated`,
                type: 'success'
            });
        }, 1500);
    });

    return (
        <GeneratingModal
            key={2}
            generate={generate}
            title={c('Title').t`Updating...`}
            onSuccess={onSuccess}
            onClose={handleCancel}
        />
    )
};

ReactivateKeyModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    keyData: PropTypes.object.isRequired,
    keyInfo: PropTypes.object.isRequired
};

export default ReactivateKeyModalProcess;
