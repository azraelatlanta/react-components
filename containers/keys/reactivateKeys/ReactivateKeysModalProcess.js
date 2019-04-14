import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useAuthenticationStore, useNotifications } from 'react-components';

const ReactivateKeysModalProcess = ({ onSuccess, onClose, ...rest }) => {
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();

    const handleCancel = () => onClose();

    const generate = () => {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, 500);
        });
    };

    return (
        <GeneratingModal
            key={2}
            generate={generate}
            title={c('Title').t`Updating...`}
            onSuccess={onSuccess}
            onClose={handleCancel}
        />
    );
};

ReactivateKeysModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired,
    addressesKeys: PropTypes.object.isRequired
};

export default ReactivateKeysModalProcess;
