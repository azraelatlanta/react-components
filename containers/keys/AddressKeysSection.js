import React, { useRef, useState } from 'react';
import { c } from 'ttag';
import { generateKey, keyInfo as getKeyInfo } from 'pmcrypto';
import { getKeySalts } from 'proton-shared/lib/api/keys';
import { KEY_FILE_EXTENSION } from 'proton-shared/lib/constants';
import { algorithmExists } from 'proton-shared/lib/keys/keyGeneration';

import GeneratingModal from './modals/GeneratingModal';
import SimilarKeyModalWarning from './modals/SimilarKeyWarningModal';
import SelectEncryptionModal from './modals/SelectEncryptionModal';
import ReactivateKeyModal from './modals/ReactivateKeyModal';
import ImportKeyModal from './modals/ImportKeyModal';
import SelectAddressModal from './modals/SelectAddressModal';
import ExportKeyModal from './modals/ExportKeyModal';

import AddressKeysHeader from './AddressKeysHeader';
import ContactKeysHeader from './ContactKeysHeader';
import AddressKeysTable from './AddressKeysTable';
import { getAddressesKeys, getUserAddressKeys, getHeaderActions } from './AddressKeysSectionModel';
import usePrompts from '../../hooks/usePrompts';
import useAuthenticationStore from '../../hooks/useAuthenticationStore';
import useNotifications from '../../hooks/useNotifications';
import useEventManager from '../../hooks/useEventManager';
import useUserKeys from '../../models/userKeysModel';
import useAddressesKeys from '../../models/addressesKeysModel';
import { useUser } from '../../models/userModel';
import { useAddresses } from '../../models/addressesModel';
import useApi from '../../hooks/useApi';
import { ACTIONS } from './KeysActions';
import { ACTIONS as HEADER_ACTIONS } from './AddressKeysHeader';

const AddressKeysSection = () => {
    const { createNotification } = useNotifications();
    const { createPrompt } = usePrompts();
    const authenticationStore = useAuthenticationStore();
    const [loading, setLoading] = useState(loading);
    const { call } = useEventManager();
    const api = useApi();

    const keySaltRef = useRef();

    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();

    const [userKeys, loadingUserKeys] = useUserKeys(User);
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys(User, Addresses);

    const handleAddKey = async (...args) => {
        // eslint-disable-next-line
        console.log('add key', ...args);

        if (Addresses.length === 0) {
            throw new Error('No addresses to add a key to');
        }

        const address = Addresses.length === 1 ? Addresses[0] : await createPrompt((resolve, reject) => {
            return (
                <SelectAddressModal
                    Addresses={Addresses}
                    onClose={reject}
                    onSuccess={resolve}
                />);
        });

        const email = address.Email;

        const { config: encryptionConfig } = await createPrompt((resolve, reject) => {
            return (
                <SelectEncryptionModal
                    title={c('Title').t`New address key (${email})`}
                    onClose={reject}
                    onSuccess={resolve}
                />
            );
        });

        const addressKeys = Object.values(addressesKeys[address.ID]);
        const keyInfos = addressKeys.map(({ info }) => info);
        if (algorithmExists(keyInfos, encryptionConfig)) {
            await createPrompt((resolve, reject) => {
                return (
                    <SimilarKeyModalWarning onClose={reject} onSuccess={resolve}/>
                );
            });
        }

        const generate = () => generateKey({
            // TODO: Use the user name?
            userIds: [{ name, email }],
            email,
            passphrase: authenticationStore.getPassword(),
            ...encryptionConfig
        });

        const { key: decryptedKey, privateKeyArmored } = await createPrompt((resolve, reject) => {
            return (
                <GeneratingModal
                    title={c('Title').t`Generating key for (${email})`}
                    generate={generate}
                    onClose={reject}
                    onSuccess={resolve}
                />
            );
        });

        console.log(await getKeyInfo(privateKeyArmored));

        console.log(decryptedKey, privateKeyArmored);

        // manage decrypted key

        //await call();

        createNotification({
            text: c('Success').t`Private key added for ${email}`,
            type: 'success'
        });
    };

    const handleImportKey = async (...args) => {
        // eslint-disable-next-line
        console.log('import key', ...args);

        if (Addresses.length === 0) {
            throw new Error('No addresses to add a key to');
        }

        const address = Addresses.length === 1 ? Addresses[0] :
            await createPrompt((resolve, reject) => {
                return (
                    <SelectAddressModal
                        Addresses={Addresses}
                        onClose={reject}
                        onSuccess={resolve}
                    />
                );
            });

        const decryptedKeys = await createPrompt((resolve, reject) => {
            return (
                <ImportKeyModal
                    onClose={reject}
                    onSuccess={resolve}
                />
            );
        });

        console.log(decryptedKeys);

        createNotification({
            text: c('Success').t`Private keys imported`,
            type: 'success'
        });
    };

    const handleReactivateKeys = async (...args) => {
        // eslint-disable-next-line
        console.log('reactivate key', ...args);
    };

    const handleDeleteKey = async (...args) => {
        // eslint-disable-next-line
        console.log('delete key', ...args);
    };

    const handleExportKey = async ({ user, address, info, decryptedPrivateKey, isContactKey }) => {
        const { fingerprint } = info;
        const filename = ['privatekey.', isContactKey ? user.name : address.Email, '-', fingerprint, KEY_FILE_EXTENSION].join('');

        await createPrompt((resolve, reject) => {
            return (
                <ExportKeyModal
                    decryptedPrivateKey={decryptedPrivateKey}
                    filename={filename}
                    onClose={reject}
                    onSuccess={resolve}
                />
            );
        });

        createNotification({
            text: c('Success').t`Private key exported`,
            type: 'success'
        });
    };

    const handleMakePrimaryKey = async (...args) => {
        // eslint-disable-next-line
        console.log('make primary key', ...args);
    };

    const handleMarkObsoleteKey = async (...args) => {
        // eslint-disable-next-line
        console.log('mark obsolete key', ...args);
    };

    const handleMarkCompromisedKey = async (...args) => {
        // eslint-disable-next-line
        console.log('mark compromised key', ...args);
    };

    const handleReactivateKey = async ({ user, address, Key, info }) => {
        if (!keySaltRef.current) {
            keySaltRef.current = api(getKeySalts()).then(({ KeySalts }) => KeySalts);
        }

        const { KeySalt } = (await keySaltRef.current).find(({ ID }) => ID === Key.ID);

        const decryptedKey = await createPrompt((resolve, reject) => {
            return (
                <ReactivateKeyModal
                    keyInfo={info}
                    keyData={Key}
                    keySalt={KeySalt}
                    onClose={reject}
                    onSuccess={resolve}
                />
            );
        });

        console.log(decryptedKey);
        // manage decrypted key

        //await call();

        createNotification({
            text: c('Success').t`Private key reactivated`,
            type: 'success'
        });
    };

    const handleMarkValidKey = async (...args) => {
        // eslint-disable-next-line
        console.log('mark valid key', ...args);
    };

    const headerHandlers = {
        [HEADER_ACTIONS.ADD]: handleAddKey,
        [HEADER_ACTIONS.IMPORT]: handleImportKey,
        [HEADER_ACTIONS.REACTIVATE_ALL]: handleReactivateKeys
    };

    const keysHandlers = {
        [ACTIONS.DELETE]: handleDeleteKey,
        [ACTIONS.EXPORT]: handleExportKey,
        [ACTIONS.PRIMARY]: handleMakePrimaryKey,
        [ACTIONS.MARK_OBSOLETE]: handleMarkObsoleteKey,
        [ACTIONS.MARK_VALID]: handleMarkValidKey,
        [ACTIONS.MARK_COMPROMISED]: handleMarkCompromisedKey,
        [ACTIONS.REACTIVATE]: handleReactivateKey
    };

    const createActionHandler = (handler) => async ({ action, ...rest }) => {
        // Don't allow any action if something is loading
        if (loading || loadingAddresses || loadingUserKeys || loadingAddressesKeys) {
            return;
        }
        setLoading(true);
        if (!handler[action]) {
            setLoading(false);
            throw new Error('Unknown action ' + action);
        }
        await handler[action](rest).catch((e) => console.error(e));
        setLoading(false);
    };

    const keysActionHandler = createActionHandler(keysHandlers);
    const formattedAdressesKeys = getAddressesKeys(User, Addresses, addressesKeys, keysActionHandler);
    const formattedUserKeys = getUserAddressKeys(User, userKeys, keysActionHandler);

    const headerActions = getHeaderActions({
        handler: createActionHandler(headerHandlers),
        User,
        Addresses,
        userKeys,
        addressesKeys
    });

    return (
        <>
            <AddressKeysHeader actions={headerActions}/>
            <AddressKeysTable
                loading={loadingAddresses || loadingAddressesKeys}
                addressKeys={formattedAdressesKeys}
                mode={'address'}
            />

            <ContactKeysHeader/>
            <AddressKeysTable loading={loadingUserKeys} addressKeys={formattedUserKeys} mode={'user'}/>
        </>
    );
};

AddressKeysSection.propTypes = {};

export default AddressKeysSection;
