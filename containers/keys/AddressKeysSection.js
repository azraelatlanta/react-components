import React, { useRef, useState } from 'react';
import { c } from 'ttag';
import { getKeySalts } from 'proton-shared/lib/api/keys';
import { KEY_FILE_EXTENSION } from 'proton-shared/lib/constants';

import AddKeyModal from './addKey/AddKeyModal';
import ImportKeyModal from './importKeys/ImportKeyModal';
import ReactivateKeyModal2 from './reactivateKey/ReactivateKeyModal';
import ExportKeyModal from './exportKey/ExportKeyModal';

import AddressKeysHeader from './AddressKeysHeader';
import ContactKeysHeader from './ContactKeysHeader';
import AddressKeysTable from './AddressKeysTable';
import { getAddressesKeys, getUserKeys, getHeaderActions } from './AddressKeysSectionModel';
import usePrompts from '../../hooks/usePrompts';
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
    const [loading, setLoading] = useState(loading);
    const { call } = useEventManager();
    const api = useApi();

    const keySaltRef = useRef();

    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();

    const [userKeys, loadingUserKeys] = useUserKeys(User);
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys(User, Addresses);

    const handleAddKey = async ({ Addresses, addressesKeys }) => {
        await createPrompt((resolve, reject) => {
            return (
                <AddKeyModal
                    onSuccess={resolve}
                    onClose={reject}
                    Addresses={Addresses}
                    addressesKeys={addressesKeys}
                />
            );
        });

        createNotification({
            text: c('Success').t`Private key added`,
            type: 'success'
        });
    };

    const handleImportKey = async ({ Addresses, addressesKeys }) => {
        await createPrompt((resolve, reject) => {
            return (
                <ImportKeyModal
                    onSuccess={resolve}
                    onClose={reject}
                    Addresses={Addresses}
                    addressesKeys={addressesKeys}
                />
            );
        });

        createNotification({
            text: c('Success').t`Private key added`,
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

    const handleExportKey = async ({ User, Address, isAddressKey, info, decryptedPrivateKey }) => {
        const { fingerprint } = info;
        const filename = ['privatekey.', isAddressKey ? Address.Email : User.name, '-', fingerprint, KEY_FILE_EXTENSION].join('');

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

    const handleReactivateKey = async ({ User, Address, addressesKeys, userKeys, isAddressKey, Key, info }) => {
        if (!keySaltRef.current) {
            keySaltRef.current = api(getKeySalts()).then(({ KeySalts }) => KeySalts);
        }

        const { KeySalt } = (await keySaltRef.current).find(({ ID }) => ID === Key.ID);

        return createPrompt((resolve, reject) => {
            return (
                <ReactivateKeyModal
                    keyInfo={info}
                    keyData={Key}
                    keySalt={KeySalt}
                    isAddressKey={isAddressKey}
                    onClose={reject}
                    onSuccess={resolve}
                />
            );
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
    const formattedAdressesKeys = getAddressesKeys({ User, Addresses, addressesKeys, handler: keysActionHandler });
    const formattedUserKeys = getUserKeys({ User, userKeys, handler: keysActionHandler });

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
