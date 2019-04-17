import React, { useState } from 'react';
import { ACTIONS } from './addressesKeysHeader/AddressKeysHeaderActions';
import AddKeyModalProcess from './addKey/AddKeyModalProcess';
import ImportKeyModalProcess from './importKeys/ImportKeyModalProcess';

const useKeysActions = ({ User, userKeys, Addresses, addressesKeys, modal, setModal }) => {
    const resetModal = () => setModal();

    const handleAddKey = () => {
        const modal = (
            <AddKeyModalProcess
                onSuccess={resetModal}
                onClose={resetModal}
                Addresses={Addresses}
                addressesKeys={addressesKeys}
            />
        );

        return setModal(modal);
    };

    const handleImportKey = () => {
        const modal = (
            <ImportKeyModalProcess
                onSuccess={resetModal}
                onClose={resetModal}
                Addresses={Addresses}
                addressesKeys={addressesKeys}
            />
        );

        return setModal(modal);
    };

    const handleReactivateAll = ({ keysToReactivate }) => {
        const modal = (
            <ReactivateKeysModal
                onSuccess={resetModal}
                onClose={resetModal}
                Addresses={Addresses}
                addressesKeys={addressesKeys}
                keysToReactivate={keysToReactivate}
            />
        );

        return setModal(modal);
    };

    const ACTIONS_TO_HANDLER = {
        [ACTIONS.ADD]: handleAddKey,
        [ACTIONS.REACTIVATE_ALL]: handleReactivateAll,
        [ACTIONS.IMPORT]: handleImportKey
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
