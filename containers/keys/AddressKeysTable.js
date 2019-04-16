import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Table, TableHeader, TableBody } from 'react-components';

import KeysTable from './KeysTable';
import AddressKeysRow from './AddressKeysRow';

const AddressKeysTable = ({ addressKeys, title, loading }) => {
    const list = addressKeys.map(({ fingerprint, email, type, keys }) => {
        return (
            <AddressKeysRow key={fingerprint} email={email} fingerprint={fingerprint} type={type}>
                <KeysTable keys={keys} />
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
    loading: PropTypes.bool
};

export default AddressKeysTable;
