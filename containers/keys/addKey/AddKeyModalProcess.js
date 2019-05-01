import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getAlgorithmExists } from 'proton-shared/lib/keys/keysAlgorithm';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from 'proton-shared/lib/constants';
import { Alert, useEventManager, useAuthenticationStore, useApi, Loader } from 'react-components';

import RenderModal from '../shared/RenderModal';
import SelectAddress from '../shared/SelectAddress';
import SelectEncryption from './SelectEncryption';
import SimilarKeyWarning from './SimilarKeyWarning';
import createKeysManager from 'proton-shared/lib/keys/keysManager';

const AddKeyModalProcess = ({ onSuccess, onClose, Addresses, addressesKeysMap }) => {
    const authenticationStore = useAuthenticationStore();
    const api = useApi();
    const { call } = useEventManager();

    const [addressIndex, setAddressIndex] = useState(0);
    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);

    const [state, setState] = useState(() => {
        return Addresses.length === 1 ? { step: 1, address: Addresses[0] } : { step: 0 }
    });

    const handleSelectEncryption = () => {
        const { address } = state;

        const addressKeysList = addressesKeysMap[address.ID];
        const addressKeysAlgorithms = addressKeysList.map(({ info: { algorithmInfo } }) => algorithmInfo);

        const encryptionConfig = ENCRYPTION_CONFIGS[encryptionType];
        const encryption = { type: encryptionType, config: encryptionConfig };

        const algorithmExists = getAlgorithmExists(addressKeysAlgorithms, encryptionConfig);

        setState({ ...state, encryption, step: algorithmExists ? 2 : 3 });
    };

    const generateKey = async () => {
        const { address, encryption: { config } } = state;

        const addressKeysList = addressesKeysMap[address.ID];

        const keysManager = createKeysManager(addressKeysList);

        try {
            const { info } = await keysManager.createAddressKey({
                Address: address,
                password: authenticationStore.getPassword(),
                encryptionConfig: config,
                api
            });

            // Trigger the event manager but no need to wait for it
            call();

            setState({ ...state, newKey: info, step: 4 });
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (state.step === 3) {
            generateKey();
        }
    }, [state.step]);

    const currentModalProps = [
        () => ({
            title: c('Title').t`Select address`,
            container: <SelectAddress Addresses={Addresses} addressIndex={addressIndex} setAddressIndex={setAddressIndex} />,
            submit: c('Action').t`Select address`,
            onSubmit: () => setState({ ...state, address: Addresses[addressIndex], step: 1 })
        }),
        () => ({
            title: c('Title').t`Select configuration`,
            container: <SelectEncryption encryptionType={encryptionType} setEncryptionType={setEncryptionType} />,
            submit: c('Action').t`Select`,
            onSubmit: handleSelectEncryption
        }),
        () => ({
            title: c('Title').t`Similar key already active`,
            container: (<SimilarKeyWarning/>),
            submit: c('Action').t`Yes`,
            onSubmit: () => setState({ ...state, step: 3 })
        }),
        () => ({
            title: c('Title').t`Generating ${state.encryption.type} key`,
            container: (<Loader/>),
            close: undefined // override the default close
        }),
        () => {
            const fp = <code key="0">{state.newKey.fingerprints[0]}</code>;
            const success =  (<Alert>{c('Info').jt`Key with fingerprint ${fp} successfully created`}</Alert>);
            return {
                title: c('Title').t`Key successfully created`,
                container: success,
                onSubmit: onSuccess
            }
        },
    ][state.step]();

    const close = c('Action').t`Close`;

    return <RenderModal onClose={onClose} close={close} {...currentModalProps}/>;
};

AddKeyModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired,
    addressesKeysMap: PropTypes.object.isRequired,
};

export default AddKeyModalProcess;
