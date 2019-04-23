import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Block, PrimaryButton, Button } from 'react-components';

import { getAddressesKeysToReactivate } from '../AddressKeysSectionModel';
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
    const addressesKeysToReactivate = getAddressesKeysToReactivate({ Addresses, User, addressesKeys, userKeys });

    const canAddKey = true;
    const canReactivateKeys = addressesKeysToReactivate.length;

    return [
        canAddKey && { actionType: ACTIONS.ADD },
        canAddKey && { actionType: ACTIONS.IMPORT },
        canReactivateKeys && { actionType: ACTIONS.REACTIVATE_ALL, addressesKeysToReactivate }
    ].filter(Boolean);
};

const KeyActionAdd = ({ cb }) => (
    <PrimaryButton onClick={cb}>{c('Action').t`Add new key`}</PrimaryButton>
);

const KeyActionImport = ({ cb }) => (
    <Button onClick={cb}>{c('Action').t`Import key`}</Button>
);

const KeyActionReactivateAll = ({ cb, addressesKeysToReactivate }) => {
    const total = addressesKeysToReactivate.reduce((acc, { keys }) => keys.length + acc, 0);
    return (
        <Button onClick={cb}>{c('Action').t`Reactivate keys`} ({total})</Button>
    );
};

const ACTIONS_TO_COMPONENT = {
    [ACTIONS.ADD]: KeyActionAdd,
    [ACTIONS.IMPORT]: KeyActionImport,
    [ACTIONS.REACTIVATE_ALL]: KeyActionReactivateAll,
};

const AddressKeysHeaderActions = ({ actions = [], onAction }) => {
    const actionsList = actions.map((action) => {
        const handler = () => onAction(action);
        const { actionType, ...rest }  = action;
        const Component = ACTIONS_TO_COMPONENT[actionType];
        return <Component key={actionType} cb={handler} {...rest}/>
    });

    if (!actionsList.length) {
        return null;
    }

    return (
        <Block>
            {actionsList}
        </Block>
    );
};

AddressKeysHeaderActions.propTypes = {
    actions: PropTypes.array.isRequired,
    onAction: PropTypes.func.isRequired
};

export default AddressKeysHeaderActions;
