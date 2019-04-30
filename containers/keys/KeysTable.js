import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Table, TableHeader, TableBody } from 'react-components';

import KeysRow from './KeysRow';
import KeysActions from './KeysActions';
import KeysStatus from './KeysStatus';

const KeysTable = ({ loading, keys = [], onAction }) => {
    const list = keys.map(({ keyID, addressID, actions, statuses, fingerprint, type }) => {
        const handleAction = (actionType) => {
            onAction({
                actionType,
                keyID,
                addressID
            })
        };

        const keysActions = (
            <KeysActions onAction={handleAction} actions={actions} />
        );

        const keysStatus = (
            <KeysStatus statuses={statuses} />
        );

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

    return (
        <Table>
            <TableHeader
                cells={[
                    { el: c('Title header for keys table').t`Fingerprint`, className: 'w40' },
                    c('Title header for keys table').t`Key type`,
                    c('Title header for keys table').t`Status`,
                    c('Title header for keys table').t`Actions`
                ]}
            />
            <TableBody loading={loading} colSpan={4}>{list}</TableBody>
        </Table>
    );
};

KeysTable.propTypes = {
    keys: PropTypes.array.isRequired,
    loading: PropTypes.bool,
    onAction: PropTypes.func.isRequired
};

export default KeysTable;
