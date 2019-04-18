import React from 'react';
import ExportKeyModal from './exportKey/ExportKeyModal';
import ReactivateKeyModalProcess from './reactivateKey/ReactivateKeyModalProcess';
import { ACTIONS } from './KeysActions';
import { KEY_FILE_EXTENSION } from 'proton-shared/lib/constants';

const useKeysActions = ({ User, Addresses, addressesKeys, userKeys, modal, setModal }) => {
    const resetModal = () => setModal();

    const getAddress = (addressID) => {
        return addressID ? Addresses.find(({ ID }) => ID === addressID) : undefined;
    };

    const getKey = (addressID, keyID) => {
        return addressID ?
            addressesKeys[addressID][keyID] :
            userKeys[keyID];
    };

    const handleExport = ({ key, address }) => {
        const name = address ? address.Email : User.Name;
        const { decryptedPrivateKey, info: { fingerprint: [fingerprint] } } = key;

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
        const { Key, info } = key;

        const modal = (
            <ReactivateKeyModalProcess
                isAddressKey={!!address}
                keysMap={address ? addressesKeys[address.ID] : undefined}
                keyData={Key}
                keyInfo={info}
                onClose={resetModal}
                onSuccess={resetModal}
            />
        );

        setModal(modal);
    };

    const ACTIONS_TO_HANDLER = {
        [ACTIONS.EXPORT]: handleExport,
        [ACTIONS.REACTIVATE]: handleReactivate
    };

    return ({ actionType, keyID, addressID }) => {
        if (modal) {
            return;
        }
        if (!ACTIONS_TO_HANDLER[actionType]) {
            throw new Error('unsupported action');
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
