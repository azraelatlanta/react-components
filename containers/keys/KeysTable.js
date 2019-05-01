import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Table, TableCell, TableBody } from 'react-components';

import KeysRow from './KeysRow';
import KeysActions from './KeysActions';
import KeysStatus from './KeysStatus';

const KeysTable = ({ loading, keys, onAction }) => {
    const list = keys.map(({ keyID, addressID, actions, statuses, fingerprint, type }) => {
        const handleAction = (actionType) => {
            onAction({ actionType, keyID, addressID })
        };

        const keysActions = <KeysActions onAction={handleAction} actions={actions} />;
        const keysStatus = <KeysStatus statuses={statuses} />;

        return (
            <KeysRow
                key={fingerprint}
                fingerprint={fingerprint}
                type={type}
                status={keysStatus}
                actions={keysActions}
            />
        );
    });

    const headerCells = [
        { node: c('Title header for keys table').t`Fingerprint`, className: 'w50' },
        { node: c('Title header for keys table').t`Key type` },
        { node: c('Title header for keys table').t`Status` },
        { node: c('Title header for keys table').t`Actions` }
    ].map((({ node, className = '' }, i) => {
        return <TableCell key={i.toString()} className={className} type="header">{node}</TableCell>
    }));

    const header = <thead><tr>{headerCells}</tr></thead>;

    return (
        <Table>
            {header}
            <TableBody loading={loading} colSpan={4}>{list}</TableBody>
        </Table>
    );
};

KeysTable.propTypes = {
    keys: PropTypes.array,
    loading: PropTypes.bool,
    onAction: PropTypes.func.isRequired
};

KeysTable.defaultProps = {
    keys: []
};

export default KeysTable;
