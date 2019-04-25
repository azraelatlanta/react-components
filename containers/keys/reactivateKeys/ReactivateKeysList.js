import { c } from 'ttag';
import React from 'react';
import PropTypes from 'prop-types';
import { Table, TableRow, TableHeader, TableBody, BadgeWithTooltip } from 'react-components';

import KeysStatus, { STATUSES } from '../KeysStatus';

export const STATUS = {
    INACTIVE: 1,
    SUCCESS: 2,
    LOADING: 3,
    ERROR: 4
};

export const convertStatus = (keyResult, defaultStatus) => {
    if (typeof keyResult === 'undefined') {
        return {
            status: defaultStatus
        };
    }
    if (keyResult instanceof Error) {
        if (keyResult.name === 'DecryptionError') {
            return {
                status: STATUS.INACTIVE
            }
        }
        return {
            error: keyResult.message,
            status: STATUS.ERROR
        };
    }
    return {
        status: STATUS.SUCCESS
    }
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
        return <BadgeWithTooltip {...KeyStatusError(error)}/>
    }
    if (status === STATUS.INACTIVE || status === STATUS.ERROR) {
        return <KeysStatus statuses={[STATUSES.ENCRYPTED]} />;
    }
    if (status === STATUS.SUCCESS) {
        return <KeysStatus statuses={[STATUSES.DECRYPTED]} />;
    }
    return 'TODO Loading spinner'
};

const ReactivateKeysList = ({ keys }) => {
    const list = keys.map(({ status, fingerprint, email, error }, i) => {
        const keyStatus = getStatus(status, error);
        return (
            <TableRow
                key={i}
                cells={[
                    email,
                    <span className="mw100 inbl ellipsis">{fingerprint}</span>,
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
