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

const KeysActions = ({ actions }) => {
    const [action, setAction] = useState();

    const reset = () => {
        setAction();
    };

    const handleExport = ({ User, Address, isAddressKey, info, decryptedPrivateKey }) => {
        const { fingerprint } = info;
        const filename = ['privatekey.', isAddressKey ? Address.Email : User.name, '-', fingerprint, KEY_FILE_EXTENSION].join('');
        const modal = (
            <ExportKeyModal
                decryptedPrivateKey={decryptedPrivateKey}
                filename={filename}
                onClose={reset}
                onSuccess={reset}
            />
        );
        return setAction(modal);
    };

    const handleReactivate = async ({ User, Address, isAddressKey, Key, info }) => {
        const modal = (
            <ReactivateKeyModalProcess
                keyData={Key}
                keyInfo={info}
                onSuccess={reset}
                onClose={reset}
            />
        );
        return setAction(modal);
    };

    const ACTIONS_TO_HANDLER = {
        [ACTIONS.EXPORT]: handleExport,
        [ACTIONS.REACTIVATE]: handleReactivate,
    };

    const createHandler = (cb) => () => {
        const { action, ...rest } = cb();
        ACTIONS_TO_HANDLER[action](rest);
    };

    const list = actions.map(({ action, cb }) => ({
        ...ACTIONS_TO_TEXT[action](),
        type: 'button',
        onClick: createHandler(cb)
    }));

    return (
        <>
            {action}
            <DropdownActions list={list} />
        </>
    );
};

KeysActions.propTypes = {
    actions: PropTypes.array.isRequired
};

export default KeysActions;
