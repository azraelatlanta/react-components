import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { useNotifications } from 'react-components';

import SelectAddressModal from '../addKey/SelectAddressModal';
import { getInitialState, reducer, ACTIONS } from './reducer';
import GeneratingModal from '../addKey/GeneratingModal';
import SelectFilesModal from '../importKeys/SelectFilesModal';

const ReactivateKeyModal = ({ onClose, onSuccess, ...rest }) => {
    const [state, dispatch] = useReducer(reducer, getInitialState(rest));
    const { createNotification } = useNotifications();

    const handleCancel = () => onClose();

    const {
        address,
        files,
    } = state;

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

ReactivateKeyModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired,
    addressesKeys: PropTypes.object.isRequired,
};

export default ReactivateKeyModal;
