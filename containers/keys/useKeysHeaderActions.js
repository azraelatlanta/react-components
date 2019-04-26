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
    const api = useApi();
    const { call } = useEventManager();
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();

    const resetModal = () => {
        setModal();
    };

    const handleAddKey = async () => {
        const handle = async ({ address, encryption: { config: encryptionConfig }}) => {
            const { ID: AddressID, Email } = address;
            const password = authenticationStore.getPassword();
            const oldAddressKeys = addressesKeys[AddressID];

            const { key: decryptedPrivateKey, privateKeyArmored: armoredPrivateKey } = await generateKey({
                // TODO: Use the user name?
                userIds: [{ name: Email, email: Email }],
                email: Email,
                passphrase: password,
                ...encryptionConfig
            });

            const info = await getKeyInfoLight(decryptedPrivateKey);

            await addKeyHelper({
                Address: address,
                key: { info, decryptedPrivateKey, armoredPrivateKey },
                keys: oldAddressKeys,
                api
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

        const handleImportKeys = ({ Address, decryptedKeys }) => {
            return reactivateOrAddKeysHelper({
                Address,
                keys: Address ? addressesKeys[Address.ID] : userKeys,
                decryptedKeys,
                api,
                password
            })
        };

        const modal = (
            <ImportKeyModalProcess
                onSuccess={resetModal}
                onClose={resetModal}
                importKeys={handleImportKeys}
                Addresses={Addresses}
            />
        );

        setModal(modal);
    };

    const handleReactivateAll = ({ addressesKeysToReactivate }) => {
        const password = authenticationStore.getPassword();

        const handleReactivateKeys = ({ User, Address, decryptedKeys }) => {
            return reactivateOrAddKeysHelper({
                Address,
                User,
                keys: Address ? addressesKeys[Address.ID] : userKeys,
                decryptedKeys,
                api,
                password
            })
        };

        const modal = (
            <ReactivateKeysModalProcess
                onSuccess={resetModal}
                onClose={resetModal}
                reactivateKeys={handleReactivateKeys}
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
