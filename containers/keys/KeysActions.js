import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { DropdownActions } from 'react-components';
import { c } from 'ttag';
import { KEY_FILE_EXTENSION } from 'proton-shared/lib/constants';

import ExportKeyModal from './exportKey/ExportKeyModal';
import ReactivateKeyModalProcess from './reactivateKey/ReactivateKeyModalProcess';

export const ACTIONS = {
    PRIMARY: 1,
    DELETE: 2,
    EXPORT: 3,
    REACTIVATE: 4,
    MARK_COMPROMISED: 5,
    MARK_OBSOLETE: 6,
    MARK_VALID: 7
};

const KeyActionExport = () => ({
    text: c('Keys actions').t`Export`
});
const KeyActionDelete = () => ({
    text: c('Keys actions').t`Delete`
});
const KeyActionPrimary = () => ({
    text: c('Keys actions').t`Make primary`
});
const KeyActionReactive = () => ({
    text: c('Keys actions').t`Reactivate`
});
const KeyActionMarkCompromised = () => ({
    text: c('Keys actions').t`Mark compromised`
});
const KeyActionMarkObsolete = () => ({
    text: c('Keys actions').t`Mark obsolete`
});
const KeyActionMarkValid = () => ({
    text: c('Keys actions').t`Mark valid`
});

const ACTIONS_TO_TEXT = {
    [ACTIONS.PRIMARY]: KeyActionPrimary,
    [ACTIONS.DELETE]: KeyActionDelete,
    [ACTIONS.EXPORT]: KeyActionExport,
    [ACTIONS.REACTIVATE]: KeyActionReactive,
    [ACTIONS.MARK_COMPROMISED]: KeyActionMarkCompromised,
    [ACTIONS.MARK_OBSOLETE]: KeyActionMarkObsolete,
    [ACTIONS.MARK_VALID]: KeyActionMarkValid
};

const KeysActions = ({ actions, onAction }) => {
    const list = actions.map((actionType) => ({
        ...ACTIONS_TO_TEXT[actionType](),
        type: 'button',
        onClick: () => onAction(actionType)
    }));

    return (
        <>
            <DropdownActions list={list} />
        </>
    );
};

KeysActions.propTypes = {
    actions: PropTypes.array.isRequired,
    onAction: PropTypes.func.isRequired,
};

export default KeysActions;
