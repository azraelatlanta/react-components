import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useAuthenticationStore, useNotifications } from 'react-components';

import RenderModal from '../shared/RenderModal';

const ReactivateKeysModalProcess = ({ Addresses, addressesKeys, keysToReactivate, onSuccess, onClose }) => {
    const [state, setState] = useState({ step: 0 });
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();

    const { step, address, files = {} } = state;

    const reactivateKeysProcess = async () => {
        console.log(address);
        const { Email } = address;
        const name = Email;
        const email = Email;

        console.log(files);

        createNotification({
            text: c('Success').t`Private key added for ${email}`,
            type: 'success'
        });

        onSuccess();
    };

    useEffect(() => {
        if (step === 3) {
            reactivateKeysProcess();
        }
    }, [step]);

    const currentStep = [
        () => ({
            title: c('Title').t`Re-activate keys`,
            container: <div>{keysToReactivate.length} TODO</div>,
            submit: c('Action').t`Re-activate`,
            onSubmit: () => setState({ ...state, step: 1 }),
        }),
        () => ({
            title: c('Title').t`Enter password to continue`,
            container: <div>TODO</div>,
            submit: c('Action').t`Select address`,
            onSubmit: () => setState({ ...state, step: 1 })
        }),
    ][step]();

    const close = c('Action').t`Close`;

    return <RenderModal onClose={onClose} close={close} {...currentStep}/>;
};

ReactivateKeysModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired,
    addressesKeys: PropTypes.object.isRequired
};

export default ReactivateKeysModalProcess;
