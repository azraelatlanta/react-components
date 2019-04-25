import React from 'react';
import PropTypes from 'prop-types';
import {
    Label,
    Field,
    PasswordInput,
} from 'react-components';
import { decryptPrivateKey } from 'pmcrypto';

import { generateUID } from '../../../helpers/component';
import { computeKeyPassword } from 'pm-srp';
import { createDecryptionError } from './DecryptionError';

export const decrypt = async ({ password, keySalt, armoredPrivateKey }) => {
    const keyPassword = keySalt ? await computeKeyPassword(password, keySalt) : password;
    return decryptPrivateKey(armoredPrivateKey, keyPassword)
        .catch(() => {
            throw new createDecryptionError();
        });
};

const DecryptKey = ({ label, password, setPassword }) => {
    const id = generateUID('decryptKey');

    const handleChange = ({ target }) => setPassword(target.value);

    return (
        <>
            <Label htmlFor={id}>{label}</Label>
            <Field>
                <PasswordInput id={id} value={password} onChange={handleChange} autoFocus={true} required/>
            </Field>
        </>
    );
};

DecryptKey.propTypes = {
    label: PropTypes.node.isRequired,
    password: PropTypes.string.isRequired,
    setPassword: PropTypes.func.isRequired
};

export default DecryptKey;
