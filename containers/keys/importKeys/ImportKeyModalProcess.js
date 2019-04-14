import React, { useReducer, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import {
    useNotifications,
    Alert,
    Modal,
    ContentModal,
    FooterModal,
    ResetButton,
    PrimaryButton
} from 'react-components';

import SelectAddress from '../shared/SelectAddress';
import { getInitialState, reducer, ACTIONS } from './reducer';
import SelectAndDecryptFiles from '../shared/SelectAndDecryptFiles';

const ImportKeyModalProcess = ({ Addresses, addressesKeys, onSuccess, onClose }) => {
    const [state, dispatch] = useReducer(reducer, getInitialState(Addresses));
    const selectRef = useRef();
    const [addressIndex, setAddressIndex] = useState(0);
    const { createNotification } = useNotifications();

    const {
        address,
        files,
        step
    } = state;

    console.log(state);

    const importKeyProcess = async () => {
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
        if (step === ACTIONS.PROCESS) {
            importKeyProcess();
        }
    }, [step]);

    const getStepContainer = () => {
        if (step === ACTIONS.WARN) {
            return {
                title: c('Title').t`Import key`,
                container: (
                    <Alert>
                        {c('Alert').t`Are you sure you want to import a private key? Importing an insecurely generated or leaked private key can harm the security of your emails.`}
                    </Alert>
                ),
                handler: () => {
                    dispatch({ type: ACTIONS.WARN });
                }
            };
        }

        if (step === ACTIONS.SELECT_ADDRESS) {
            return {
                title: c('Title').t`Select address`,
                container: (
                    <SelectAddress Addresses={Addresses} addressIndex={addressIndex} setAddressIndex={setAddressIndex}/>
                ),
                handler: () => {
                    dispatch({ type: ACTIONS.SELECT_ADDRESS, payload: Addresses[addressIndex] });
                }
            };
        }

        if (step === ACTIONS.SELECT_FILES) {
            const { Email } = address;
            const handleSuccess = (files) => {
                dispatch({ type: ACTIONS.SELECT_FILES, payload: files });
            };
            const handleError = (error) => {
                createNotification({
                    text: error,
                    type: 'error'
                });
            };
            return {
                title: c('Title').t`New address key (${Email})`,
                container: (
                    <SelectAndDecryptFiles ref={selectRef} onSuccess={handleSuccess} onError={handleError}/>
                ),
                handler: () => {
                    selectRef.current.click();
                }
            };
        }

        if (step === ACTIONS.PROCESS) {
            return {
                title: c('Title').t`Loading`,
                container: (
                    'Loading'
                ),
                handler: () => {
                }
            };
        }
    };

    const {
        container,
        title,
        handler
    } = getStepContainer();

    return (
        <Modal show={true} onClose={onClose} title={title} type="small">
            <ContentModal onSubmit={handler} onReset={onClose}>
                {container}
                <FooterModal>
                    <ResetButton onClick={onClose}>{c('Label').t`Cancel`}</ResetButton>
                    <PrimaryButton type="submit">{c('Label').t`Next`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

ImportKeyModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired,
    addressesKeys: PropTypes.object.isRequired
};

export default ImportKeyModalProcess;
