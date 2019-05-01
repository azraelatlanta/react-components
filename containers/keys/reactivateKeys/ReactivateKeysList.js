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
    UPLOADED: 2,
    SUCCESS: 3,
    LOADING: 4,
    ERROR: 5
};

const KeyStatusError = (error) => {
    return {
        tooltip: error.message,
        title: c('Key state badge').t`Error`,
        type: 'error'
    };
};

const getStatus = (status, result) => {
    if (status === STATUS.ERROR) {
        return <BadgeWithTooltip {...KeyStatusError(result)}/>;
    }
    if (status === STATUS.INACTIVE || status === STATUS.UPLOADED) {
        return <KeysStatus statuses={[STATUSES.ENCRYPTED]}/>;
    }
    if (status === STATUS.SUCCESS) {
        return <KeysStatus statuses={[STATUSES.DECRYPTED]}/>;
    }
};

const getUploadStatus = ({ isUploaded, handleUpload }) => {
    if (isUploaded) {
        return (
            <Badge type="success">
                {c('Action').t`Key uploaded`}
            </Badge>
        );
    }
    return (
        <Button onClick={handleUpload}>
            {c('Action').t`Upload`}
        </Button>
    );
};

const ReactivateKeysList = ({ loading, allToReactivate, onUpload, onError }) => {
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

        const keysWithFingerprint = files.filter(({ info: { fingerprints: [fingerprint] } }) => fingerprint === uploadFingerprint);
        if (keysWithFingerprint.length === 0) {
            return onError(c('Error').t`Uploaded key does not match fingerprint`);
        }

        onUpload(keysWithFingerprint[0]);
    };

    const list = allToReactivate.map(({ User, Address, keys }) => {
        const email = Address ? Address.Email : User.Name;

        return keys.map(({ Key, info, status, result }) => {
            const [fingerprint] = info.fingerprints;

            const keyStatus = loading && !result ? <LoaderIcon/> : getStatus(status, result);

            return (
                <TableRow
                    key={Key.ID}
                    cells={[
                        <span className="mw100 inbl ellipsis">{email}</span>,
                        <code className="mw100 inbl ellipsis">{fingerprint}</code>,
                        keyStatus,
                        isUpload ? getUploadStatus({
                            handleUpload: () => handleUpload(fingerprint),
                            isUploaded: status === STATUS.UPLOADED
                        }) : null
                    ].filter(Boolean)}
                />
            );
        });
    }).flat(); // TODO: Verify this works with polyfill on edge?

    return (
        <>
            {isUpload ?
                <SelectKeyFiles ref={selectRef} multiple={false} onFiles={handleFiles} autoClick={false}/> : null}
            <Table>
                <TableHeader
                    cells={[
                        c('Title header for keys table').t`Email`,
                        c('Title header for keys table').t`Fingerprint`,
                        c('Title header for keys table').t`Status`,
                        isUpload ? c('Title header for keys table').t`Action` : null
                    ].filter(Boolean)}
                />
                <TableBody>
                    {list}
                </TableBody>
            </Table>
        </>
    );
};

ReactivateKeysList.propTypes = {
    allToReactivate: PropTypes.array.isRequired,
    onUpload: PropTypes.func,
    loading: PropTypes.bool,
    onError: PropTypes.func
};

export default ReactivateKeysList;
