import { describe } from 'proton-shared/lib/keys/keysAlgorithm';

import { STATUSES } from './KeysStatus';
import { ACTIONS } from './KeysActions';

const getKeyStatus = ({ decryptedPrivateKey, Key, isPrimary, Address = {} }) => {
    const { Flags } = Key;
    const { Status } = Address;

    const isDecrypted = !!decryptedPrivateKey;

    return {
        isPrimary,
        isDecrypted,
        isCompromised: isDecrypted && Flags > 0 && Flags < 3 && Status !== 0,
        isObsolete: Flags === 0,
        isDisabled: Status === 0
    }
};

const getKeyStatuses = ({ isPrimary, isDecrypted, isCompromised, isObsolete, isDisabled }) => {
    return [
        isPrimary && STATUSES.PRIMARY,
        isDecrypted && STATUSES.DECRYPTED,
        !isDecrypted && STATUSES.ENCRYPTED,
        isCompromised && STATUSES.COMPROMISED,
        isObsolete && STATUSES.OBSOLETE,
        isDisabled && STATUSES.DISABLED
    ].filter(Boolean);
};

const getKeyActions = ({ User, Address = {}, isAddressKey, Key, keyStatus }) => {
    const {
        isPrimary,
        isDecrypted,
        isCompromised
    } = keyStatus;

    const { isSubUser } = User;
    const { Flags } = Key;
    const { Status } = Address;

    const canExport = !isSubUser && isDecrypted;
    const canReactivate = !isDecrypted;
    const canDelete = !isPrimary && isAddressKey;
    const canMakePrimary = !isPrimary && isDecrypted && Flags === 3 && Status !== 0;

    const canMark = isAddressKey;
    // TODO: There is one MARK OBSOLETE case to investigate when Flags === 0 for addresses
    const canMarkObsolete = canMark && Flags > 1 && Status !== 0;
    const canMarkCompromised = canMark && Flags !== 0;
    const canMarkValid = canMark && isCompromised;

    return [
        canExport && ACTIONS.EXPORT,
        canReactivate && ACTIONS.REACTIVATE,
        canMakePrimary && ACTIONS.PRIMARY,
        canMarkCompromised && ACTIONS.MARK_COMPROMISED,
        canMarkObsolete && ACTIONS.MARK_OBSOLETE,
        canMarkValid && ACTIONS.MARK_VALID,
        canDelete && ACTIONS.DELETE
    ]
        .filter(Boolean);
};

export const convertKey = ({
    User,
    Address,
    isAddressKey,
    isPrimary,
    key: {
        decryptedPrivateKey,
        Key,
        info
    }
}) => {
    const keyStatus = getKeyStatus({
        decryptedPrivateKey,
        Key,
        info,
        isPrimary,
        Address
    });

    const keyStatuses = getKeyStatuses(keyStatus);
    const keyActions = getKeyActions({
        decryptedPrivateKey,
        Key,
        User,
        Address,
        isAddressKey,
        keyStatus
    });

    return {
        keyID: Key.ID,
        addressID: Address ? Address.ID : undefined,
        fingerprint: info.fingerprints[0],
        type: describe(info.algorithmInfo),
        statuses: keyStatuses,
        actions: keyActions
    }
};

export const getUserKeysList = (User, userKeys = {}) => {
    return Object.values(userKeys).map(({ decryptedPrivateKey, info, Key }) => {
        return convertKey({
            User,
            isAddressKey: false,
            isPrimary: Key.Primary === 1,
            key: {
                decryptedPrivateKey,
                info,
                Key
            }
        })
    });
};

export const getAddressKeysList = (User, Address, addressKeys = {}) => {
    return Object.values(addressKeys).map(({ decryptedPrivateKey, info, Key }) => {
        return convertKey({
            User,
            Address,
            isAddressKey: true,
            isPrimary: Key.Primary === 1,
            key: {
                decryptedPrivateKey,
                info,
                Key
            }
        });
    });
};

export const getAddressesKeys = (User, Addresses = [], addressesKeys = {}) => {
    return Addresses.reduce((acc, Address) => {
        const { ID, Email } = Address;

        const addressKeysList = getAddressKeysList(User, Address, addressesKeys[ID]);

        const formattedAddress = {
            email: Email,
            keys: addressKeysList
        };

        acc.push(formattedAddress);

        return acc;
    }, []);
};


const getKeysToReactivate = (keys = {}) => {
    return Object.values(keys).filter(({ decryptedPrivateKey }) => !decryptedPrivateKey);
};

export const getAllKeysToReactivate = ({ Addresses, addressesKeys, userKeys }) => {
    const allAddressesKeys = Addresses.reduce((acc, { ID }) => {
        return acc.concat(getKeysToReactivate(addressesKeys[ID]));
    }, []);
    const allUserKeys = getKeysToReactivate(userKeys);
    const keysToReactivate = allAddressesKeys.concat(allUserKeys);

    const hasKeysToReactivate = !!keysToReactivate.length;

    if (!hasKeysToReactivate) {
        return [];
    }

    return keysToReactivate;
};

