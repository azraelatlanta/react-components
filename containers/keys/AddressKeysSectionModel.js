import { describe } from 'proton-shared/lib/keys/keysAlgorithm';
import { compare } from 'proton-shared/lib/helpers/array';

import { STATUSES } from './KeysStatus';
import { ACTIONS } from './KeysActions';
import { ACTIONS as HEADER_ACTIONS } from './AddressKeysHeader';

const createKeyConverter = ({ User, Addresses, Address, isAddressKey, handler }) => ({ decryptedPrivateKey, Key, info }, i) => {
    const handleAction = (action) => () => handler({
        action,
        isAddressKey,
        User,
        Address,
        Addresses,
        Key,
        info,
        decryptedPrivateKey,
    });

    const { Flags } = Key;
    const { Status } = Address || {};

    const isPrimary = i === 0;
    const isDecrypted = !!decryptedPrivateKey;
    const isCompromised = isDecrypted && Flags > 0 && Flags < 3 && Status !== 0;
    const isSubUser = User.isSubUser;

    const statuses = [
        isPrimary && STATUSES.PRIMARY,
        isDecrypted && STATUSES.DECRYPTED,
        !isDecrypted && STATUSES.ENCRYPTED,
        isCompromised && STATUSES.COMPROMISED,
        Flags === 0 && STATUSES.OBSOLETE,
        Status === 0 && STATUSES.DISABLED
    ].filter(Boolean);

    const canExport = !isSubUser && isDecrypted;
    const canReactivate = !isDecrypted;
    const canDelete = !isPrimary && isAddressKey;
    const canMakePrimary = !isPrimary && isDecrypted && Flags === 3 && Status !== 0;

    const canMark = isAddressKey;
    // TODO: There is one MARK OBSOLETE case to investigate when Flags === 0 for addresses
    const canMarkObsolete = canMark && Flags > 1 && Status !== 0;
    const canMarkCompromised = canMark && Flags !== 0;
    const canMarkValid = canMark && isCompromised;

    const actions = [
        canExport && ACTIONS.EXPORT,
        canReactivate && ACTIONS.REACTIVATE,
        canMakePrimary && ACTIONS.PRIMARY,
        canMarkCompromised && ACTIONS.MARK_COMPROMISED,
        canMarkObsolete && ACTIONS.MARK_OBSOLETE,
        canMarkValid && ACTIONS.MARK_VALID,
        canDelete && ACTIONS.DELETE
    ]
        .filter(Boolean)
        .map((action) => ({ action, cb: handleAction(action) }));

    return {
        id: Key.ID,
        fingerprint: info.fingerprint,
        type: describe(info),
        statuses,
        actions
    };
};

const getKeysList = (keys = {}, convertKey) => {
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

export const getAddressesKeys = ({ User, Addresses = [], addressesKeys = {}, handler }) => {
    return Addresses.reduce((acc, Address) => {
        const keyConverter = createKeyConverter({
            handler,
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

export const getUserKeys = ({ User = {}, userKeys = {}, handler }) => {
    const keyConverter = createKeyConverter({
        User,
        userKeys,
        handler,
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

const getAllKeysToReactivate = ({ Addresses, addressesKeys, userKeys }) => {
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

export const getHeaderActions = ({
    handler,
    Addresses = [],
    User = {},
    userKeys = {},
    addressesKeys = {}
}) => {
    const canAddKey = true;

    const createCb = ({ action, ...rest }) => () => handler({
        action,
        ...rest,
        User,
        Addresses,
        addressesKeys,
        userKeys
    });

    const keysToReactivate = getAllKeysToReactivate({ Addresses, User, addressesKeys, userKeys });

    const headerActions = [
        canAddKey && { action: HEADER_ACTIONS.ADD },
        canAddKey && { action: HEADER_ACTIONS.IMPORT },
        keysToReactivate.length && { action: HEADER_ACTIONS.REACTIVATE_ALL, keysToReactivate }
    ].filter(Boolean);

    return headerActions.map(({ action, ...rest }) => ({
        action,
        ...rest,
        cb: createCb({ action, ...rest })
    }));
};
