import React from 'react';
import { KEY_FILE_EXTENSION } from 'proton-shared/lib/constants';

import ExportKeyModal from './exportKey/ExportKeyModal';
import ReactivateKeysModalProcess from './reactivateKeys/ReactivateKeysModalProcess';
import AddKeyModalProcess from './addKey/AddKeyModalProcess';

export const ACTIONS = {
    PRIMARY: 1,
    DELETE: 2,
    EXPORT: 3,
    REACTIVATE: 4,
    MARK_COMPROMISED: 5,
    MARK_OBSOLETE: 6,
    MARK_VALID: 7,
    ADD_KEY: 8,
    REACTIVATE_KEYS: 9,
    IMPORT_KEYS: 10
};

const HEADER_ACTIONS = [
    ACTIONS.ADD_KEY,
    ACTIONS.REACTIVATE_KEYS,
    ACTIONS.IMPORT_KEYS
];

const useKeysActions = ({
    User,
    Addresses,
    addressesKeysMap,
    userKeysList,
    modal,
    setModal
}) => {
    const resetModal = () => setModal();

    const getAddress = (addressID) => {
        return addressID ? Addresses.find(({ ID }) => ID === addressID) : undefined;
    };

    const getKey = (addressID, keyID) => {
        return addressID ?
            addressesKeysMap[addressID].find(({ Key: { ID } }) => ID === keyID) :
            userKeysList.find(({ Key: { ID } }) => ID === keyID);
    };

    const handleExport = ({ key, address }) => {
        const name = address ? address.Email : User.Name;
        const { decryptedPrivateKey, info: { fingerprints: [fingerprint] } } = key;

        const filename = ['privatekey.', name, '-', fingerprint, KEY_FILE_EXTENSION].join('');

        const modal = (
            <ExportKeyModal
                decryptedPrivateKey={decryptedPrivateKey}
                filename={filename}
                onClose={resetModal}
                onSuccess={resetModal}
            />
        );
        setModal(modal);
    };

    const handleReactivate = ({ key, address }) => {
        const addressesKeysToReactivate = address ?
            [{ Address: address, inactiveKeys: [key], allKeys: addressesKeysMap[address.ID] }] :
            [{ User, keys: [key], allKeys: userKeysList }];

        const modal = (
            <ReactivateKeysModalProcess
                onSuccess={resetModal}
                onClose={resetModal}
                addressesKeysToReactivate={addressesKeysToReactivate}
            />
        );
        setModal(modal);
    };

    const handleAddKey = () => {
        const modal = (
            <AddKeyModalProcess
                onSuccess={resetModal}
                onClose={resetModal}
                Addresses={Addresses}
                addressesKeysMap={addressesKeysMap}
            />);
        setModal(modal);
    };

    const handleImportKeys = () => {
        const modal = (
            <ImportKeyModalProcess
                onSuccess={resetModal}
                onClose={resetModal}
                Addresses={Addresses}
                addressesKeysMap={addressesKeysMap}
            />);
        setModal(modal);
    };

    const handleReactivateAll = ({ addressesKeysToReactivate }) => {
        const modal = (
            <ReactivateKeysModalProcess
                onSuccess={resetModal}
                onClose={resetModal}
                addressesKeysToReactivate={addressesKeysToReactivate}
                addressesKeysMap={addressesKeysMap}
                userKeysList={userKeysList}
            />
        );

        return setModal(modal);
    };

    const ACTIONS_TO_HANDLER = {
        [ACTIONS.ADD_KEY]: handleAddKey,
        [ACTIONS.IMPORT_KEYS]: handleImportKeys,
        [ACTIONS.REACTIVATE_KEYS]: handleReactivateAll,
        [ACTIONS.EXPORT]: handleExport,
        [ACTIONS.REACTIVATE]: handleReactivate
    };

    return ({ actionType, keyID, addressID, ...rest }) => {
        if (modal) {
            return;
        }

        if (!ACTIONS_TO_HANDLER[actionType]) {
            throw new Error('unsupported action');
        }

        if (HEADER_ACTIONS.includes(actionType)) {
            return ACTIONS_TO_HANDLER[actionType](rest);
        }

        const key = getKey(addressID, keyID);
        const address = getAddress(addressID);

        if (!key || (addressID && !address)) {
            throw new Error('Could not find address or key');
        }

        ACTIONS_TO_HANDLER[actionType]({ key, address });
    };
};

export default useKeysActions;
