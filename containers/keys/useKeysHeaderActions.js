import React from 'react';
import { ACTIONS } from './addressesKeysHeader/AddressKeysHeaderActions';
import AddKeyModalProcess from './addKey/AddKeyModalProcess';
import ImportKeyModalProcess from './importKeys/ImportKeyModalProcess';
import ReactivateKeysModalProcess from './reactivateKeys/ReactivateKeysModalProcess';
import { c } from 'ttag';

import { createAddressKeyRoute, reactivateKeyRoute } from 'proton-shared/lib/api/keys';
import { getKeyInfoLight, generateKey, reformatKey, decryptPrivateKey } from 'pmcrypto';
import { useApi, useEventManager, useAuthenticationStore, useNotifications } from 'react-components';
import { keysReducer } from 'proton-shared/lib/keys/keysReducer';
import { addKey, reactivateKey } from 'proton-shared/lib/keys/keysReducerActions';
import getSignedKeyList from 'proton-shared/lib/keys/getSignedKeyList';

const reactivateKeyHelper = async ({
    Address: { Receive = 1 } = {}, // For contact keys, default to be Receive true
    keys,
    key: {
        ID,
        decryptedPrivateKey,
        armoredPrivateKey,
        info
    },
    api
}) => {
    const newKeys = keysReducer(keys, reactivateKey({
        ID,
        canReceive: Receive,
        decryptedPrivateKey,
        info
    }));

    const { Key: { Primary }} = newKeys[ID];

    const signedKeyList = await getSignedKeyList(newKeys);

    const route = reactivateKeyRoute({
        Primary,
        PrivateKey: armoredPrivateKey,
        SignedKeyList: signedKeyList
    });

    await api(route);

    return newKeys;
};

const addKeyHelper = async ({
    Address: { ID: AddressID, Receive },
    keys,
    key: {
        decryptedPrivateKey,
        armoredPrivateKey,
        info
    },
    api
}) => {
    const tempKeyID = 'PENDING';
    const newAddressKeys = keysReducer(keys, addKey({
        ID: tempKeyID,
        canReceive: Receive,
        decryptedPrivateKey,
        info
    }));
    const newKey = newAddressKeys[tempKeyID];
    const { Key: { Primary }} = newKey;

    const signedKeyList = await getSignedKeyList(newAddressKeys);

    const route = createAddressKeyRoute({
        AddressID,
        Primary,
        PrivateKey: armoredPrivateKey,
        SignedKeyList: signedKeyList
    });

    const { Key: { ID: realKeyID } } = await api(route);

    delete newAddressKeys[tempKeyID];
    newAddressKeys[realKeyID] = newKey;

    return newAddressKeys;
};

const reactivateOrAddKeyHelper = async ({
    Address,
    key: { info, decryptedPrivateKey, armoredPrivateKey },
    maybeOldKey,
    keys,
    api
}) => {
    return true;
    if (maybeOldKey) {
        const oldKeyID = maybeOldKey.Key.ID;
        return reactivateKeyHelper({
            Address,
            key: { info, armoredPrivateKey, decryptedPrivateKey, ID: oldKeyID },
            keys,
            api
        })
    }

    return addKeyHelper({
        Address,
        key: { info, armoredPrivateKey, decryptedPrivateKey },
        keys,
        api
    });
};

const reactivateOrAddKeysHelper = async ({
    Address,
    User,
    keys,
    decryptedKeys,
    password,
    api
}) => {
    const email = Address ? Address.Email : User.Email;

    const results = {};
    for (const resultID of Object.keys(decryptedKeys)) {
        try {
            const oldDecryptedPrivateKey = decryptedKeys[resultID];

            // TODO: pmcrypto does not return the new decryptedPrivateKey when reformatting.
            const armoredPrivateKey = await reformatKey(oldDecryptedPrivateKey, email, password);
            const decryptedPrivateKey = await decryptPrivateKey(armoredPrivateKey, password);
            const info = await getKeyInfoLight(decryptedPrivateKey);

            const oldAddressKeysList = Object.values(keys);
            const [keyFingerprint] = info.fingerprints;
            const maybeOldKey = oldAddressKeysList.find(({ info: { fingerprints: [fingerprint]} }) => {
                return keyFingerprint === fingerprint;
            });

            // Key already exists and is decrypted, ignore it.
            if (maybeOldKey && maybeOldKey.decryptedPrivateKey) {
                throw new Error(c('Message').t`Key exists and is decrypted`);
            }

            // Reactivate or add key for imports
            keys = await reactivateOrAddKeyHelper({
                Address,
                key: { info, decryptedPrivateKey, armoredPrivateKey },
                maybeOldKey,
                keys,
                api
            });

            results[resultID] = {
                message: maybeOldKey ?
                    c('Message').t`Key reactivated` :
                    c('Message').t`Key created`
            };
        } catch (e) {
            results[resultID] = e;
        }
    }
    return results;
};

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
