import { KEY_FLAG } from 'proton-shared/lib/constants';
import { describe } from 'proton-shared/lib/keys/keysAlgorithm';

const { SIGNED, ENCRYPTED, ENCRYPTED_AND_SIGNED, CLEAR_TEXT } = KEY_FLAG;

import { STATUSES } from './KeysStatus';
import { ACTIONS } from './KeysActions';

const getKeyStatus = ({ decryptedPrivateKey, Key, isPrimary, Address = {} }) => {
    const { Flags } = Key;
    const { Status } = Address;

    const isDecrypted = !!decryptedPrivateKey;
    const isDisabled = Status === 0;

    return {
        isPrimary,
        isDecrypted,
        isCompromised: Flags === CLEAR_TEXT,
        isObsolete: isDecrypted && !isDisabled && Flags === SIGNED,
        isDisabled
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
        isCompromised,
        isObsolete
    } = keyStatus;

    const { isSubUser } = User;
    const { Flags } = Key;
    const { Status } = Address;

    const canExport = !isSubUser && isDecrypted;
    const canReactivate = !isDecrypted;
    const canDelete = !isPrimary && isAddressKey;
    const canMakePrimary = !isPrimary && isDecrypted && Flags === 3 && Status !== 0;

    const canMark = isAddressKey;
    const canMarkObsolete = canMark && isDecrypted && !isObsolete && !isCompromised;
    const canMarkCompromised = canMark && !isCompromised;
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

const concatKeys = (arr, value) => {
    if (!value.keys.length) {
        return arr;
    }
    return arr.concat(value);
};

export const getAddressesKeysToReactivate = ({ Addresses, addressesKeys, User, userKeys }) => {
    const allAddressesKeys = Addresses.reduce((acc, Address) => {
        const { ID } = Address;
        const addressKeysToReactivate = getKeysToReactivate(addressesKeys[ID]);
        return concatKeys(acc, { Address, keys: addressKeysToReactivate });
    }, []);

    const allUserKeys = { User, keys: getKeysToReactivate(userKeys) };
    return concatKeys(allAddressesKeys, allUserKeys);
};

