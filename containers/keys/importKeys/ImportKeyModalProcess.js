import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useNotifications } from 'react-components';

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

const ImportKeyModalProcess = ({ Addresses, onSuccess, onClose }) => {
    const [state, setState] = useState(getInitialState(Addresses));
    const { createNotification } = useNotifications();
    const selectAndDecryptStep = useSelectAndDecryptStep();

    const [addressIndex, setAddressIndex] = useState(0);
    const { step, address } = state;

    const handleSelectFiles = (files) => {
        const nextState = { ...state, files, step: 3 };
        setState(nextState);
        onSuccess(nextState);
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
    Addresses: PropTypes.array.isRequired
};

export default ImportKeyModalProcess;
