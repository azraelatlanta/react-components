import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Block, PrimaryButton, Button } from 'react-components';

import { getAllKeysToReactivate } from '../AddressKeysSectionModel';
import AddKeyModalProcess from '../addKey/AddKeyModalProcess';
import ImportKeyModalProcess from '../importKeys/ImportKeyModalProcess';
import ReactivateKeysModal from '../reactivateKeys/ReactivateKeysModalProcess'

export const ACTIONS = {
    ADD: 1,
    IMPORT: 2,
    REACTIVATE_ALL: 3
};

/**
 * Get the action that can be performed in the header of the section.
 * @param {Array} Addresses
 * @param {Object} User
 * @param {Object} userKeys
 * @param {Object} addressesKeys
 * @returns {Array}
 */
export const getHeaderActions = ({
    Addresses = [],
    User = {},
    userKeys = {},
    addressesKeys = {}
}) => {
    const createCb = ({ action, ...rest }) => () => ({
        action,
        ...rest,
        User,
        Addresses,
        addressesKeys,
        userKeys
    });

    const keysToReactivate = getAllKeysToReactivate({ Addresses, User, addressesKeys, userKeys });

    const canAddKey = true;
    const canReactivateKeys = keysToReactivate.length;

    const headerActions = [
        canAddKey && { action: ACTIONS.ADD },
        canAddKey && { action: ACTIONS.IMPORT },
        canReactivateKeys && { action: ACTIONS.REACTIVATE_ALL, keysToReactivate }
    ].filter(Boolean);

    return headerActions.map(({ action, ...rest }) => ({
        action,
        ...rest,
        cb: createCb({ action, ...rest })
    }));
};

const KeyActionAdd = (cb) => {
    return (
        <PrimaryButton key={ACTIONS.IMPORT} onClick={cb}>{c('Action').t`Add new key`}</PrimaryButton>
    );
};

const KeyActionImport = (cb) => {
    return (
        <Button key={ACTIONS.ADD} onClick={cb}>{c('Action').t`Import key`}</Button>
    );
};

const KeyActionReactivateAll = (cb, { keysToReactivate }) => (
    <Button key={ACTIONS.REACTIVATE_ALL} onClick={cb}>{c('Action').t`Reactivate keys`} ({keysToReactivate.length})</Button>
);

const ACTIONS_TO_COMPONENT = {
    [ACTIONS.ADD]: KeyActionAdd,
    [ACTIONS.IMPORT]: KeyActionImport,
    [ACTIONS.REACTIVATE_ALL]: KeyActionReactivateAll,
};

const AddressKeysHeaderActions = ({ actions = [] }) => {
    const [action, setAction] = useState();

    const reset = () => {
        setAction();
    };

    const createHandler = (cb) => () => {
        const { action, ...rest } = cb();

        const { Addresses, addressesKeys } = rest;

        if (action === ACTIONS.ADD) {
            const modal = (
                <AddKeyModalProcess
                    onSuccess={reset}
                    onClose={reset}
                    Addresses={Addresses}
                    addressesKeys={addressesKeys}
                />
            );

            return setAction(modal);
        }

        if (action === ACTIONS.IMPORT) {
            const modal = (
                <ImportKeyModalProcess
                    onSuccess={reset}
                    onClose={reset}
                    Addresses={Addresses}
                    addressesKeys={addressesKeys}
                />
            );

            return setAction(modal);
        }

        if (action === ACTIONS.REACTIVATE_ALL) {
            const { keysToReactivate } = rest;

            const modal = (
                <ReactivateKeysModal
                    onSuccess={reset}
                    onClose={reset}
                    Addresses={Addresses}
                    addressesKeys={addressesKeys}
                    keysToReactivate={keysToReactivate}
                />
            );

            return setAction(modal);
        }
    };

    const actionsList = actions.map(({ action, cb, ...rest }) => {
        const handler = createHandler(cb);
        return ACTIONS_TO_COMPONENT[action](handler, rest)
    });

    if (!actionsList.length) {
        return null;
    }

    return (
        <Block>
            {action}
            {actionsList}
        </Block>
    )
};

AddressKeysHeaderActions.propTypes = {
    actions: PropTypes.array.isRequired,
};

export default AddressKeysHeaderActions;
