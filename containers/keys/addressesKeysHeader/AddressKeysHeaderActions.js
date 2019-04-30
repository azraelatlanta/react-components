import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Block, PrimaryButton, Button } from 'react-components';

import { getAddressesKeysToReactivate } from '../AddressKeysSectionModel';
import { ACTIONS } from '../useKeysActions';


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
    [ACTIONS.ADD_KEY]: KeyActionAdd,
    [ACTIONS.IMPORT_KEYS]: KeyActionImport,
    [ACTIONS.REACTIVATE_KEYS]: KeyActionReactivateAll,
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
