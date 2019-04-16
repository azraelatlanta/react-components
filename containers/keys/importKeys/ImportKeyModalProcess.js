import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useAuthenticationStore, useNotifications } from 'react-components';

import SelectAddress from '../shared/SelectAddress';
import RenderModal from '../shared/RenderModal';
import Warning from './Warning';
import useSelectAndDecryptStep from './useSelectAndDecryptStep';

const getInitialState = (Addresses) => {
    if (Addresses.length === 1) {
        const address = Addresses[0];
        return {
            address,
            step: 0
        }
    }
    return {
        step: 0
    }
};

const ImportKeyModalProcess = ({ Addresses, addressesKeys, onSuccess, onClose }) => {
    const [state, setState] = useState(getInitialState(Addresses));
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();
    const selectAndDecryptStep = useSelectAndDecryptStep();

    const [addressIndex, setAddressIndex] = useState(0);
    const { step, address, files = {} } = state;

    const importKeyProcess = async () => {
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
            importKeyProcess();
        }
    }, [step]);

    const handleSelectFiles = (files) => {
        setState({ ...state, files, step: 3 });
    };

    const handleError = (text) => {
        createNotification({ type: 'error', text });
    };

    const currentStep = [
        () => ({
            title: c('Title').t`Import key`,
            container: <Warning/>,
            submit: c('Action').t`Yes`,
            onSubmit: () => setState({ ...state, step: address ? 2 : 1 }),
        }),
        () => ({
            title: c('Title').t`Select address`,
            container: <SelectAddress Addresses={Addresses} addressIndex={addressIndex} setAddressIndex={setAddressIndex} />,
            submit: c('Action').t`Select address`,
            onSubmit: () => setState({ ...state, address, step: 2 })
        }),
        () => selectAndDecryptStep(handleSelectFiles, handleError),
        () => ({
            title: c('Title').t`Importing key`,
            container: (<div>Loading...</div>)
        })
    ][step]();

    const close = c('Action').t`Close`;

    return <RenderModal onClose={onClose} close={close} {...currentStep}/>;
};

ImportKeyModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired,
    addressesKeys: PropTypes.object.isRequired
};

export default ImportKeyModalProcess;
