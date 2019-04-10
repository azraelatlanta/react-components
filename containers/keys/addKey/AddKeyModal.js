import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { algorithmExists } from 'proton-shared/lib/keys/keyGeneration';
import { generateKey } from 'pmcrypto';

import { useAuthenticationStore, useNotifications } from 'react-components';

import SelectAddressModal from './SelectAddressModal';
import { getInitialState, reducer, ACTIONS } from './reducer';
import SelectEncryptionModal from './SelectEncryptionModal';
import SimilarKeyWarningModal from './SimilarKeyWarningModal';
import GeneratingModal from './GeneratingModal';

const AddKeyModal = ({ onSuccess, onClose, ...rest }) => {
    const [state, dispatch] = useReducer(reducer, getInitialState(rest));
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();

    const handleCancel = () => onClose();

    const {
        Addresses,
        address,
        addressKeys,
        encryptionConfig,
        warned,
        generating
    } = state;

    if (!address) {
        return (
            <SelectAddressModal
                Addresses={Addresses}
                onSuccess={(address) => {
                    dispatch({
                        type: ACTIONS.SELECT_ADDRESS,
                        payload: address
                    });
                }}
                onClose={handleCancel}
            />
        )
    }

    const email = address.Email;

    if (!encryptionConfig) {
        return (
            <SelectEncryptionModal
                title={c('Title').t`New address key (${email})`}
                onSuccess={({ config }) => dispatch({ type: ACTIONS.SELECT_ENCRYPTION, payload: config })}
                onClose={handleCancel}
            />
        )
    }

    const addressKeyInfos = addressKeys.map(({ info }) => info);
    if (!warned && algorithmExists(addressKeyInfos, encryptionConfig)) {
        return (
            <SimilarKeyWarningModal
                onClose={handleCancel}
                onSuccess={() => dispatch({ type: ACTIONS.WARNED })}
            />
        )
    }

    if (generating) {
        const generate = () => generateKey({
            // TODO: Use the user name?
            userIds: [{ name, email }],
            email,
            passphrase: authenticationStore.getPassword(),
            ...encryptionConfig
        });
        return (
            <GeneratingModal
                key={1}
                generate={generate}
                title={c('Title').t`Generating address key (${email})`}
                onSuccess={(data) => dispatch({ type: ACTIONS.GENERATE, payload: data })}
                onClose={handleCancel}
            />
        )
    }

    const generate = () => new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
            //await call();
            createNotification({
                text: c('Success').t`Private key added for ${email}`,
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

AddKeyModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired,
    addressesKeys: PropTypes.object.isRequired,
};

export default AddKeyModal;
