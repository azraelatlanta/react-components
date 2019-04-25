import { c } from 'ttag';
import React from 'react';
import PropTypes from 'prop-types';
import { Table, TableRow, TableHeader, TableBody, BadgeWithTooltip } from 'react-components';

export const STATUS = {
    SUCCESS: 1,
    LOADING: 2,
    ERROR: 3
};

export const convertStatus = (result, defaultStatus) => {
    if (typeof result === 'undefined') {
        return defaultStatus;
    }
    return {
        status: result instanceof Error ? STATUS.ERROR : STATUS.SUCCESS,
        message: result.message,
    }
};

const getError = (error) => {
    return {
        tooltip: error,
        title: c('Title').t`Error`,
        type: 'error'
    }
};

const getSuccess = (message) => {
    return {
        tooltip: message,
        title: c('Title').t`Success`,
        type: 'success'
    }
};

const getStatus = (status, message) => {
    if (status === STATUS.ERROR) {
        return <BadgeWithTooltip {...getError(message)}/>
    }
    if (status === STATUS.SUCCESS) {
        return <BadgeWithTooltip {...getSuccess(message) }/>
    }
    return 'TODO Loading spinner'
};

const ImportKeysList = ({ keys }) => {
    const list = keys.map(({ status, fingerprint, message }, i) => {
        const keyStatus = getStatus(status, message);
        return (
            <TableRow
                key={i}
                cells={[
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
                    c('Title header for keys table').t`Fingerprint`,
                    c('Title header for keys table').t`Status`
                ]}
            />
            <TableBody>{list}</TableBody>
        </Table>
    );
};

ImportKeysList.propTypes = {
    keys: PropTypes.array.isRequired
};

export default ImportKeysList;
