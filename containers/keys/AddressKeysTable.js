import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Table, TableHeader, TableBody } from 'react-components';

import KeysTable from './KeysTable';
import AddressKeysRow from './AddressKeysRow';

const AddressKeysTable = ({ onAction, addressKeys, title, loading }) => {
    const list = addressKeys.map(({ email, keys }) => {
        const primaryKey = keys[0] || {};

        const { fingerprint, type } = primaryKey;

        return (
            <AddressKeysRow key={fingerprint} email={email} fingerprint={fingerprint} type={type}>
                <KeysTable keys={keys} onAction={onAction} />
            </AddressKeysRow>
        );
    });

    return (
        <Table>
            <TableHeader
                cells={[
                    title,
                    c('Title header for keys table').t`Fingerprint`,
                    c('Title header for keys table').t`Key type`
                ]}
            />
            <TableBody loading={loading} colSpan={3}>
                {list}
            </TableBody>
        </Table>
    );
};

AddressKeysTable.propTypes = {
    addressKeys: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired,
    onAction: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default AddressKeysTable;
