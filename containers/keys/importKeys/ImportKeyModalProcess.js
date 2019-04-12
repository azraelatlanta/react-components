import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { useNotifications } from 'react-components';

import SelectAddressModal from '../addKey/SelectAddressModal';
import { getInitialState, reducer, ACTIONS } from './reducer';
import GeneratingModal from '../addKey/GeneratingModal';
import SelectFilesModal from './SelectFilesModal';
import ImportWarningModal from './ImportWarningModal';

const ImportKeyModalProcess = ({ Addresses, addressesKeys, onSuccess, onClose }) => {
    const [state, dispatch] = useReducer(reducer, getInitialState({ Addresses }));
    const { createNotification } = useNotifications();

    const handleCancel = () => onClose();

    const {
        address,
        files,
        warned
    } = state;

    if (!warned) {
        return (
            <ImportWarningModal
                Addresses={Addresses}
                onSuccess={() => {dispatch({ type: ACTIONS.WARNED })}}
                onClose={handleCancel}
            />
        )
    }

    if (!address) {
        return (
            <SelectAddressModal
                Addresses={Addresses}
                onSuccess={(address) => {
                    const addressKeys = addressesKeys[address.ID];
                    dispatch({
                        type: ACTIONS.SELECT_ADDRESS,
                        payload: { address, addressKeys }
                    });
                }}
                onClose={handleCancel}
            />
        )
    }

    const email = address.Email;

    if (!files) {
        return (
            <SelectFilesModal
                title={c('Title').t`New address key (${email})`}
                onSuccess={(files) => dispatch({ type: ACTIONS.SELECT_FILES, payload: files })}
                onClose={handleCancel}
            />
        )
    }


    const generate = () => new Promise((resolve, reject) => {
        setTimeout(resolve, 1500);
        console.log('files', files);

        //await call();
        createNotification({
            text: c('Success').t`Private keys imported`,
            type: 'success'
        });
    });

    return (
        <GeneratingModal
            generate={generate}
            title={c('Title').t`Updating...`}
            onClose={handleCancel}
            onSuccess={onSuccess}
        />
    )
};

ImportKeyModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired,
    addressesKeys: PropTypes.object.isRequired,
};

export default ImportKeyModalProcess;
