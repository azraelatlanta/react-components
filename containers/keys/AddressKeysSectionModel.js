import { describe } from 'proton-shared/lib/keys/keysAlgorithm';
import { compare } from 'proton-shared/lib/helpers/array';

import { STATUSES } from './KeysStatus';
import { ACTIONS } from './KeysActions';

const getKeyStatus = ({ decryptedPrivateKey, Key, isPrimary, Address }) => {
    const { Flags } = Key;
    const { Status } = Address || {};

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
    ].filter(Boolean)
};

const getKeyActions = ({ User, Address, Addresses, isAddressKey, decryptedPrivateKey, Key, info, keyStatus }) => {
    const {
        isPrimary,
        isDecrypted,
        isCompromised
    } = keyStatus;

    const createCb = (action) => () => ({
        action,
        User,
        Address,
        Addresses,
        isAddressKey,
        decryptedPrivateKey,
        Key,
        info
    });

    const { isSubUser } = User;
    const { Flags } = Key;
    const { Status } = Address || {};

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
        .filter(Boolean)
        .map((action) => ({ action, cb: createCb(action) }));
};

const createKeyConverter = ({ User, Addresses, Address, isAddressKey }) => ({ decryptedPrivateKey, Key, info }, i) => {
    const keyStatus = getKeyStatus({
        decryptedPrivateKey,
        isPrimary: i === 0,
        Key,
        info,
        Address
    });

    const keyStatuses = getKeyStatuses(keyStatus);
    const keyActions = getKeyActions({
        User,
        Addresses,
        Address,
        isAddressKey,
        decryptedPrivateKey,
        Key,
        info,
        keyStatus
    });

    return {
        id: Key.ID,
        fingerprint: info.fingerprint,
        type: describe(info),
        statuses: keyStatuses,
        actions: keyActions
    }
};

export const getKeysList = (keys = {}, convertKey) => {
    const keysList = Object.values(keys);
    if (!keysList.length) {
        return [];
    }
    return keysList
        .sort((a, b) => {
            const {
                Key: { Primary: aPrimary }
            } = a;
            const {
                Key: { Primary: bPrimary }
            } = b;

            return compare(bPrimary, aPrimary);
        })
        .map(convertKey);
};

export const getAddressesKeys = ({ User, Addresses = [], addressesKeys = {} }) => {
    return Addresses.reduce((acc, Address) => {
        const keyConverter = createKeyConverter({
            User,
            Address,
            Addresses,
            addressesKeys,
            isAddressKey: true
        });

        const { ID, Email } = Address;
        const addressKeysList = getKeysList(addressesKeys[ID], keyConverter);
        if (!addressKeysList.length) {
            return acc;
        }

        // TODO: Relies on the stable insertion order in ES2015. Verify this.
        const primaryKey = addressKeysList[0];
        acc.push({
            email: Email,
            ...primaryKey,
            keys: addressKeysList
        });

        return acc;
    }, []);
};

export const getUserKeys = ({ User = {}, userKeys = {} }) => {
    const keyConverter = createKeyConverter({
        User,
        userKeys,
        isAddressKey: false
    });
    const userKeysList = getKeysList(userKeys, keyConverter);
    if (!userKeysList.length) {
        return [];
    }
    // TODO: Relies on the stable insertion order in ES2015. Verify this.
    const primaryKey = userKeysList[0];
    return [
        {
            email: User.Name,
            ...primaryKey,
            keys: userKeysList
        }
    ];
};

const getKeysToReactivate = (keys = {}) => {
    const id = (arg) => arg;
    return getKeysList(keys, id).filter(({ decryptedPrivateKey }) => !decryptedPrivateKey);
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

