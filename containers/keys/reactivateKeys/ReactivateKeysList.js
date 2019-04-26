import React, { useState, useRef } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Badge,
    Button,
    LoaderIcon,
    Table,
    TableRow,
    TableHeader,
    TableBody,
    BadgeWithTooltip
} from 'react-components';

import SelectKeyFiles from '../shared/SelectKeyFiles';

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
    return <LoaderIcon/>
};

const ReactivateKeysList = ({ keys, onUpload, onError }) => {
    const [uploadFingerprint, setUploadFingerprint] = useState('');
    const selectRef = useRef();

    const isUpload = onUpload;

    const handleUpload = (fingerprint) => {
        setUploadFingerprint(fingerprint);
        selectRef.current.click();
    };

    const handleFiles = (files) => {
        if (files.length === 0) {
            return onError(c('Error').t`Invalid private key file`);
        }

        const keysWithFingerprint = files.filter(({ info: { fingerprints: [fingerprint]} }) => fingerprint === uploadFingerprint);
        if (keysWithFingerprint.length === 0) {
            return onError(c('Error').t`Uploaded key does not match fingerprint`);
        }

        onUpload(keysWithFingerprint[0]);
    };

    const list = keys.map(({ status, fingerprint, email, isUploaded, error }, i) => {
        const keyStatus = getStatus(status, error);

        const getUploadStatus = () => {
            if (isUploaded) {
                return (
                    <Badge type="success">
                        {c('Action').t`Key uploaded`}
                    </Badge>
                );
            }
            return (
                <Button onClick={() => handleUpload(fingerprint)}>
                    {c('Action').t`Upload`}
                </Button>
            );
        };

        return (
            <TableRow
                key={i}
                cells={[
                    <span className="mw100 inbl ellipsis">{email}</span>,
                    <span className="mw100 inbl ellipsis">{fingerprint}</span>,
                    keyStatus,
                    isUpload ? getUploadStatus() : null
                ].filter(Boolean)}
            />
        );
    });

    return (
        <Table>
            <TableHeader
                cells={[
                    c('Title header for keys table').t`Email`,
                    c('Title header for keys table').t`Fingerprint`,
                    c('Title header for keys table').t`Status`,
                    isUpload ? c('Title header for keys table').t`Action` : null
                ].filter(Boolean)}
            />
            { isUpload ? <SelectKeyFiles ref={selectRef} multiple={false} onFiles={handleFiles} autoClick={false}/> : null }
            <TableBody>{list}</TableBody>
        </Table>
    );
};

ReactivateKeysList.propTypes = {
    keys: PropTypes.array.isRequired,
    onUpload: PropTypes.func,
    onError: PropTypes.func
};

export default ReactivateKeysList;
