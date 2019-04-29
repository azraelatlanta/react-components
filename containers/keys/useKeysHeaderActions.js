import React from 'react';
import { ACTIONS } from './addressesKeysHeader/AddressKeysHeaderActions';
import AddKeyModalProcess from './addKey/AddKeyModalProcess';
import ImportKeyModalProcess from './importKeys/ImportKeyModalProcess';
import ReactivateKeysModalProcess from './reactivateKeys/ReactivateKeysModalProcess';
import { c } from 'ttag';

import { getKeyInfoLight, generateKey } from 'pmcrypto';
import { useApi, useEventManager, useAuthenticationStore, useNotifications } from 'react-components';
import { reactivateOrAddKeysHelper, addKeyHelper } from 'proton-shared/lib/keys/keysActions';

const useKeysActions = ({ User, userKeys, Addresses, addressesKeys, modal, setModal }) => {
    const keysManager = useKeysManager();
    const api = useApi();
    const { call } = useEventManager();
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();

    const resetModal = () => {
        setModal();
    };

    const handleAddKey = async () => {
        const handle = async ({ address, encryption: { config: encryptionConfig }}) => {
            const { Email } = address;
            const password = authenticationStore.getPassword();

            await keysManager.createAddressKey({
                Address: address,
                password,
                api,
                encryptionConfig
            });

            await call();

            createNotification({
                text: c('Success').t`Private key added for ${Email}`,
                type: 'success'
            });
        };

        const onSuccess = async (result) => {
            try {
                await handle(result);
                resetModal();
            } catch (e) {
                console.log(e);
                resetModal();
            }
        };

        const modal = (
            <AddKeyModalProcess
                onSuccess={onSuccess}
                onClose={resetModal}
                Addresses={Addresses}
                addressesKeys={addressesKeys}
            />
        );

        setModal(modal);
    };

    const handleImportKeys = () => {
        const password = authenticationStore.getPassword();

        const handleImportKey = ({ Address, decryptedKey }) => {
            return keysManager.importKey({
                Address,
                User,
                password,
                oldDecryptedPrivateKey: decryptedKey,
                api
            });
        };

        const modal = (
            <ImportKeyModalProcess
                onSuccess={resetModal}
                onClose={resetModal}
                importKey={handleImportKey}
                Addresses={Addresses}
            />
        );

        setModal(modal);
    };

    const handleReactivateAll = ({ addressesKeysToReactivate }) => {
        const password = authenticationStore.getPassword();

        const handleReactivateKey = ({ User, Address, decryptedKey }) => {
            return keysManager.reactivateKey({
                Address,
                User,
                password,
                oldDecryptedPrivateKey: decryptedKey,
                api
            });
        };

        const modal = (
            <ReactivateKeysModalProcess
                onSuccess={resetModal}
                onClose={resetModal}
                reactivateKey={handleReactivateKey}
                addressesKeysToReactivate={addressesKeysToReactivate}
            />
        );

        return setModal(modal);
    };

    const ACTIONS_TO_HANDLER = {
        [ACTIONS.ADD]: handleAddKey,
        [ACTIONS.IMPORT]: handleImportKeys,
        [ACTIONS.REACTIVATE_ALL]: handleReactivateAll
    };

    return ({ actionType, ...rest }) => {
        if (modal) {
            return;
        }
        if (!ACTIONS_TO_HANDLER[actionType]) {
            throw new Error('Could not find action');
        }
        ACTIONS_TO_HANDLER[actionType](rest);
    };
};

export default useKeysActions;
