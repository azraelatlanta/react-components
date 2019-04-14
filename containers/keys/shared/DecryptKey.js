import React, { useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Label,
    PasswordInput,
} from 'react-components';

import { generateUID } from '../../../helpers/component';

const DecryptKey = ({ fingerprint, armoredKey, keyPassword, setKeyPassword }) => {

    const id = generateUID('decryptKey');

    const handleChange = ({ target }) => setKeyPassword(target.value);

    return (
        <>
            <Label htmlFor={id}>{c('Label').t`Enter the password for key with fingerprint:`}
                <code>{fingerprint}</code></Label>
            <PasswordInput id={id} value={keyPassword} onChange={handleChange} autoFocus={true} required/>
        </>
    );
};

DecryptKey.propTypes = {
    fingerprint: PropTypes.string.isRequired,
    armoredKey: PropTypes.string.isRequired
};

export default DecryptKey;
