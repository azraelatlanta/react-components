import { c } from 'ttag';
import React from 'react';
import PropTypes from 'prop-types';
import { Table, TableRow, TableHeader, TableBody } from 'react-components';

import KeysStatus, { KeyStatusBadge, STATUSES } from '../KeysStatus';

export const STATUS = {
    INACTIVE: 0,
    SUCCESS: 1,
    LOADING: 2,
    ERROR: 3
};

const KeyStatusError = (error) => {
    return {
        tooltip: error,
        title: c('Key state badge').t`Error`,
        type: 'error'
    }
};

const getStatus = (status, error) => {
    if (status === STATUS.ERROR) {
        return <KeyStatusBadge {...KeyStatusError(error)}/>
    }
    if (status === STATUS.INACTIVE || status === STATUS.ERROR) {
        return <KeysStatus statuses={[STATUSES.ENCRYPTED]} />;
    }
    if (status === STATUS.SUCCESS) {
        return <KeysStatus statuses={[STATUSES.DECRYPTED]} />;
    }
    return 'Loading'
};


const ReactivateKeysList = ({ keys }) => {
    const list = keys.map(({ status, fingerprint, email, error }, i) => {
        const keyStatus = getStatus(status, error);
        return (
            <TableRow
                key={i}
                cells={[
                    email,
                    fingerprint,
                    keyStatus
                ]}
            />
        );
    });
    return (
        <Table>
            <TableHeader
                cells={[
                    c('Title header for keys table').t`Email`,
                    c('Title header for keys table').t`Fingerprint`,
                    c('Title header for keys table').t`Status`
                ]}
            />
            <TableBody>{list}</TableBody>
        </Table>
    );
};

ReactivateKeysList.propTypes = {
    keys: PropTypes.array.isRequired
};

export default ReactivateKeysList;
