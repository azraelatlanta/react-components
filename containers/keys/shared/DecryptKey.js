import React from 'react';
import PropTypes from 'prop-types';
import {
    Label,
    PasswordInput,
} from 'react-components';
import { decryptPrivateKey } from 'pmcrypto';

import { generateUID } from '../../../helpers/component';
import { computeKeyPassword } from 'pm-srp';

export const decrypt = async ({ password, keySalt, armoredKey }) => {
    const keyPassword = keySalt ? await computeKeyPassword(password, keySalt) : password;
    return decryptPrivateKey(armoredKey, keyPassword);
};

const DecryptKey = ({ label, password, setPassword }) => {
    const id = generateUID('decryptKey');

    const handleChange = ({ target }) => setPassword(target.value);

    return (
        <>
            <Label htmlFor={id}>{label}</Label>
            <PasswordInput id={id} value={password} onChange={handleChange} autoFocus={true} required/>
        </>
    );
};

DecryptKey.propTypes = {
    label: PropTypes.node.isRequired,
    password: PropTypes.string.isRequired,
    setPassword: PropTypes.func.isRequired
};

export default DecryptKey;
