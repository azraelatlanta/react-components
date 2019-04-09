import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { SubTitle, Alert, Block, PrimaryButton, Button } from 'react-components';

export const ACTIONS = {
    ADD: 1,
    IMPORT: 2,
    REACTIVATE_ALL: 3
};

const KeyActionAdd = (cb) => (
    <PrimaryButton key={ACTIONS.IMPORT} onClick={cb}>{c('Action').t`Add new key`}</PrimaryButton>
);

const KeyActionImport = (cb) => (
    <Button key={ACTIONS.ADD} onClick={cb}>{c('Action').t`Import key`}</Button>
);

const KeyActionReactivateAll = (cb, { keysToReactivate }) => (
    <Button key={ACTIONS.REACTIVATE_ALL} onClick={cb}>{c('Action').t`Reactivate keys`} ({keysToReactivate.length})</Button>
);

const ACTIONS_TO_COMPONENT = {
    [ACTIONS.ADD]: KeyActionAdd,
    [ACTIONS.IMPORT]: KeyActionImport,
    [ACTIONS.REACTIVATE_ALL]: KeyActionReactivateAll,
};

const AddressKeysHeader = ({ actions = [] }) => {
    const title = c('Title').t`Email Encryption Keys`;

    const actionsList = actions.map(({ action, cb, ...rest }) => ACTIONS_TO_COMPONENT[action](cb, rest));

    return (
        <>
            <SubTitle>{title}</SubTitle>
            <Alert learnMore="todo">
                {c('Info')
                    .t`Download your PGP Keys for use with other PGP compatible services. Only incoming messages in inline OpenPGP format are currently supported.`}
            </Alert>
            {actionsList.length ? (
                <Block>
                    {actionsList}
                </Block>
            ): null }
        </>
    );
};

AddressKeysHeader.propTypes = {
    actions: PropTypes.array.isRequired,
};

export default AddressKeysHeader;
