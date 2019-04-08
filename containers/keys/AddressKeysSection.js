import React, { useRef } from 'react';
import { c } from 'ttag';

import ReactivateKeyModal from './ReactivateKeyModal';
import ExportKeyModal from './ExportKeyModal';
import AddressKeysHeader from './AddressKeysHeader';
import ContactKeysHeader from './ContactKeysHeader';
import AddressKeysTable from './AddressKeysTable';
import { getAddressesKeys, getUserAddressKeys } from './AddressKeysSectionModel';
import usePrompts from '../../hooks/usePrompts';
import useNotifications from '../../hooks/useNotifications';
import useEventManager from '../../hooks/useEventManager';
import useUserKeys from '../../models/userKeysModel';
import useAddressesKeys from '../../models/addressesKeysModel';
import { useUser } from '../../models/userModel';
import { useAddresses } from '../../models/addressesModel';
import useApi from '../../hooks/useApi';
import { ACTIONS } from './KeysActions';
import { getKeySalts } from 'proton-shared/lib/api/keys'
import { KEY_FILE_EXTENSION } from 'proton-shared/lib/constants';

const AddressKeysSection = () => {
    const { createNotification } = useNotifications();
    const { createPrompt } = usePrompts();
    const { call } = useEventManager();
    const api = useApi();

    const keySaltRef = useRef();

    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();

    const [userKeys, loadingUserKeys] = useUserKeys(User);
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys(User, Addresses);

    const handleAddKey = (...args) => {
        // eslint-disable-next-line
        console.log('add key', ...args);
    };

    const handleImportKey = (...args) => {
        // eslint-disable-next-line
        console.log('import key', ...args);
    };

    const handleReactivateKeys = async (...args) => {
        // eslint-disable-next-line
        console.log('reactivate key', ...args);
    };

    const handleDeleteKey = (...args) => {
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

    const handleMakePrimaryKey = (...args) => {
        // eslint-disable-next-line
        console.log('make primary key', ...args);
    };

    const handleMarkObsoleteKey = (...args) => {
        // eslint-disable-next-line
        console.log('mark obsolete key', ...args);
    };

    const handleMarkCompromisedKey = (...args) => {
        // eslint-disable-next-line
        console.log('mark compromised key', ...args);
    };

    const handleReactivateKey = async ({ user, address, Key, info }) => {
        // setstate loading...

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
                    onSuccess={(decryptedKey) => resolve(decryptedKey)}
                />
            );
        });

        // manage decrypted key

        //await call();

        createNotification({
            text: c('Success').t`Private key reactivated`,
            type: 'success'
        });
    };

    const handleMarkValidKey = (...args) => {
        // eslint-disable-next-line
        console.log('mark valid key', ...args);
    };

    const headerHandlers = {
        handleAddKey,
        handleImportKey,
        handleReactivateKeys
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

    const formattedAdressesKeys = getAddressesKeys(User, Addresses, addressesKeys, keysHandlers);
    const formattedUserKeys = getUserAddressKeys(User, userKeys, keysHandlers);

    return (
        <>
            <AddressKeysHeader {...headerHandlers} />
            <AddressKeysTable
                loading={loadingAddresses || loadingAddressesKeys}
                addressKeys={formattedAdressesKeys}
                mode={'address'}
            />

            <ContactKeysHeader />
            <AddressKeysTable loading={loadingUserKeys} addressKeys={formattedUserKeys} mode={'user'} />
        </>
    );
};

AddressKeysSection.propTypes = {};

export default AddressKeysSection;
