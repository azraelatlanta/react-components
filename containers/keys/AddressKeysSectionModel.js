import { describe } from 'proton-shared/lib/keys/keysAlgorithm';
import { compare } from 'proton-shared/lib/helpers/array';

import { STATUSES } from './KeysStatus';
import { ACTIONS } from './KeysActions';
import { ACTIONS as HEADER_ACTIONS } from './AddressKeysHeader';

const createConvertKey = ({ user, address, handler }) => ({ decryptedPrivateKey, Key, info }, i) => {
    const isAddressKey = !!address;

    const handleAction = (action) => () => handler({
        action,
        user,
        address,
        Key,
        info,
        decryptedPrivateKey,
        isAddressKey
    });

    const { Flags } = Key;
    const { Status } = address || {};

    const isPrimary = i === 0;
    const isDecrypted = !!decryptedPrivateKey;
    const isCompromised = isDecrypted && Flags > 0 && Flags < 3 && Status !== 0;
    const isSubUser = user.isSubUser;

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
    const canDelete = !isPrimary && !isAddressKey;
    const canMakePrimary = !isPrimary && isDecrypted && Flags === 3 && Status !== 0;

    const canMark = !isAddressKey;
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

export const getAddressesKeys = (user = {}, addresses = [], keys = {}, handler) => {
    return addresses.reduce((acc, address) => {
        const addressKeys = getKeysList(keys[address.ID], createConvertKey({ user, address, handler }));
        if (!addressKeys.length) {
            return acc;
        }

        // TODO: Relies on the stable insertion order in ES2015. Verify this.
        const primaryKey = addressKeys[0];
        acc.push({
            email: address.Email,
            ...primaryKey,
            keys: addressKeys
        });

        return acc;
    }, []);
};

export const getUserAddressKeys = (user = {}, keys = {}, handler) => {
    const userKeys = getKeysList(keys, createConvertKey({ user, handler }));
    if (!userKeys.length) {
        return [];
    }
    // TODO: Relies on the stable insertion order in ES2015. Verify this.
    const primaryKey = userKeys[0];
    return [
        {
            email: user.Name,
            ...primaryKey,
            keys: userKeys
        }
    ];
};

const getKeysToReactivate = (keys = {}) => {
    const id = (arg) => arg;
    return getKeysList(keys, id).filter(({ decryptedPrivateKey }) => !decryptedPrivateKey);
};

export const getHeaderActions = ({
    handler,
    User,
    Addresses = [],
    userKeys = {},
    addressesKeys = {}
}) => {
    const canAddKey = true;

    const allAddressesKeys = Addresses.reduce((acc, { ID }) => {
        return acc.concat(getKeysToReactivate(addressesKeys[ID]));
    }, []);
    const allUserKeys = getKeysToReactivate(userKeys);
    const keysToReactivate = allAddressesKeys.concat(allUserKeys);

    const hasKeysToReactivate = !!keysToReactivate.length;

    const headerActions = [
        canAddKey && { action: HEADER_ACTIONS.ADD },
        canAddKey && { action: HEADER_ACTIONS.IMPORT },
        hasKeysToReactivate && {
            action: HEADER_ACTIONS.REACTIVATE_ALL,
            keysToReactivate,
            User,
            Addresses,
            userKeys,
            addressesKeys
        }
    ].filter(Boolean);

    return headerActions.map(({ action, ...rest }) => ({
        action,
        ...rest,
        cb: () => handler({ action, ...rest })
    }));
};
