import React, { useReducer, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { algorithmExists } from 'proton-shared/lib/keys/keyGeneration';
import { generateKey } from 'pmcrypto';

import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS, ENCRYPTION_TYPES } from 'proton-shared/lib/constants';
import { Modal, FooterModal, PrimaryButton, ResetButton, ContentDivModal, useAuthenticationStore, useNotifications } from 'react-components';

import SelectAddress from '../shared/SelectAddress';
import { getInitialState, reducer, ACTIONS } from './reducer';
import SelectEncryption from './SelectEncryption';
import SimilarKeyWarning from './SimilarKeyWarning';

const AddKeyModalProcess = ({ onSuccess, onClose, Addresses, addressesKeys }) => {
    const [state, dispatch] = useReducer(reducer, getInitialState(Addresses));
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();

    const [addressIndex, setAddressIndex] = useState(0);
    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);

    const {
        step,
        address,
        encryptionConfig
    } = state;

    const createKeyProcess = async () => {
        const { Email } = address;
        const name = Email;
        const email = Email;

        const key = await generateKey({
            // TODO: Use the user name?
            userIds: [{ name, email }],
            email,
            passphrase: authenticationStore.getPassword(),
            ...encryptionConfig
        });

        console.log(key);

        createNotification({
            text: c('Success').t`Private key added for ${email}`,
            type: 'success'
        });

        onSuccess();
    };

    useEffect(() => {
        if (step === ACTIONS.GENERATE) {
            createKeyProcess();
        }
    }, [step]);

    const getStepContainer = () => {
        if (step === ACTIONS.SELECT_ADDRESS) {
            return {
                title: c('Title').t`Select address`,
                container: (
                    <SelectAddress Addresses={Addresses} addressIndex={addressIndex} setAddressIndex={setAddressIndex} />
                ),
                handler: () => {
                    dispatch({ type: ACTIONS.SELECT_ADDRESS, payload: Addresses[addressIndex] });
                }
            }
        }

        if (step === ACTIONS.SELECT_ENCRYPTION) {
            const { ID, Email } = address;
            return {
                title: c('Title').t`New address key (${Email})`,
                container: (
                    <SelectEncryption encryptionType={encryptionType} setEncryptionType={setEncryptionType} />
                ),
                handler: () => {
                    const addressKeys = Object.values(addressesKeys[ID]);
                    const addressKeyInfos = addressKeys.map(({ info }) => info);
                    const encryptionConfig = ENCRYPTION_CONFIGS[encryptionType];

                    dispatch({
                        type: ACTIONS.SELECT_ENCRYPTION,
                        payload: {
                            encryptionConfig,
                            exists: algorithmExists(addressKeyInfos, encryptionConfig)
                        }
                    });
                }
            }
        }

        if (step === ACTIONS.WARN) {
            return {
                title: c('Title').t`Similar key already active`,
                container: (
                    <SimilarKeyWarning/>
                ),
                handler: () => {
                    dispatch({ type: ACTIONS.WARN });
                }
            }
        }

        if (step === ACTIONS.GENERATE) {
            return {
                title: c('Title').t`Generating ${encryptionType} key`,
                container: (
                    <div>Loading...</div>
                ),
                handler: () => {
                    dispatch({ type: ACTIONS.WARN });
                }
            }
        }
    };

    const {
        container,
        title,
        handler
    } = getStepContainer();

    return (
        <Modal show={true} onClose={onClose} title={title} type="small">
            <ContentDivModal>
                {container}
                <FooterModal>
                    <ResetButton onClick={onClose}>{c('Label').t`Cancel`}</ResetButton>
                    <PrimaryButton onClick={handler}>{c('Label').t`Next`}</PrimaryButton>
                </FooterModal>
            </ContentDivModal>
        </Modal>
    )
};

AddKeyModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired,
    addressesKeys: PropTypes.object.isRequired,
};

export default AddKeyModalProcess;
