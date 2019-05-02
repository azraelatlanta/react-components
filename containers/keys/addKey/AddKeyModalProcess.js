import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getAlgorithmExists } from 'proton-shared/lib/keys/keyGeneration';
import { createAddressKey } from 'proton-shared/lib/api/keys';
import { keyInfo as getKeyInfo, generateKey } from 'pmcrypto';
import { useApi, useEventManager, useAuthenticationStore, useNotifications } from 'react-components';

import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from 'proton-shared/lib/constants';
import { keysReducer } from 'proton-shared/lib/keys/keysReducer';
import { addKey } from 'proton-shared/lib/keys/keysReducerActions';
import getSignedKeyList from 'proton-shared/lib/keys/getSignedKeyList';

import RenderModal from '../shared/RenderModal';
import SelectAddress from '../shared/SelectAddress';
import SelectEncryption from './SelectEncryption';
import SimilarKeyWarning from './SimilarKeyWarning';

const getInitialState = (Addresses) => {
    if (Addresses.length === 1) {
        const address = Addresses[0];
        return {
            address,
            step: 1
        }
    }

    return {
        step: 0
    }
};

const AddKeyModalProcess = ({ onSuccess, onClose, Addresses, addressesKeys }) => {
    const [state, setState] = useState(getInitialState(Addresses));
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();
    const api = useApi();
    const { call } = useEventManager();

    const [addressIndex, setAddressIndex] = useState(0);
    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);

    const { step, address, encryption } = state;

    const createKeyProcess = async () => {
        const { ID: AddressID, Email, Receive } = address;
        const name = Email;
        const email = Email;

        const password = authenticationStore.getPassword();

        const { key: decryptedPrivateKey, privateKeyArmored } = await generateKey({
            // TODO: Use the user name?
            userIds: [{ name, email }],
            email,
            passphrase: password,
            ...encryption.config
        });

        console.log(decryptedPrivateKey, privateKeyArmored);

        const info = await getKeyInfo(privateKeyArmored);

        const newKeyID = 'PENDING';
        const oldAddressKeys = addressesKeys[AddressID];
        const newAddressKeys = keysReducer(oldAddressKeys, addKey({
            ID: newKeyID,
            canReceive: Receive,
            decryptedPrivateKey,
            info
        }));

        const { Key: { Primary }} = newAddressKeys[newKeyID];

        const signedKeyList = await getSignedKeyList(newAddressKeys);

        console.log({
            AddressID,
            Primary,
            PrivateKey: privateKeyArmored,
            SignedKeyList: signedKeyList
        });
        /*
        await api(createAddressKey({
            AddressID,
            Primary,
            PrivateKey: privateKeyArmored,
            SignedKeyList: signedKeyList
        }));


        await call();
         */

        createNotification({
            text: c('Success').t`Private key added for ${email}`,
            type: 'success'
        });

        onSuccess();
    };

    useEffect(() => {
        if (step === 3) {
            createKeyProcess();
        }
    }, [step]);

    const handleSelectEncryption = () => {
        const { ID } = address;

        const addressKeys = Object.values(addressesKeys[ID]);
        const addressKeyInfos = addressKeys.map(({ info }) => info);

        const encryption = { type: encryptionType, config: ENCRYPTION_CONFIGS[encryptionType] };
        const algorithmExists = getAlgorithmExists(addressKeyInfos, encryption.config);

        setState({
            ...state,
            encryption,
            step: algorithmExists ? 2 : 3
        });
    };

    const currentStep = [
        () => ({
            title: c('Title').t`Select address`,
            container: <SelectAddress Addresses={Addresses} addressIndex={addressIndex} setAddressIndex={setAddressIndex} />,
            submit: c('Action').t`Select address`,
            onSubmit: () => setState({ address: Addresses[addressIndex], step: 1 })
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
            title: c('Title').t`Generating ${encryption.type} key`,
            container: (<div>Loading...</div>),
            close: undefined
        }),
    ][step]();

    const close = c('Action').t`Close`;

    return <RenderModal onClose={onClose} close={close} {...currentStep}/>;
};

AddKeyModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired,
    addressesKeys: PropTypes.object.isRequired,
};

export default AddKeyModalProcess;
