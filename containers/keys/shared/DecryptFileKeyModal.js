import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Label,
    Field,
    PasswordInput,
    PrimaryButton
} from 'react-components';
import { c } from 'ttag';
import { decryptPrivateKey } from 'pmcrypto';

import { generateUID } from '../../../helpers/component';
import { computeKeyPassword } from 'pm-srp';
import { createDecryptionError } from './DecryptionError';
import RenderModal from './RenderModal';

export const decrypt = async ({ password, keySalt, armoredPrivateKey }) => {
    const keyPassword = keySalt ? await computeKeyPassword(password, keySalt) : password;
    return decryptPrivateKey(armoredPrivateKey, keyPassword)
        .catch(() => {
            throw createDecryptionError();
        });
};

const DecryptFileKeyModal = ({ fingerprint, armoredPrivateKey, onSuccess, onClose }) => {
    const id = generateUID('decryptKey');
    const fingerprintCode = (<code key="0">{fingerprint}</code>);
    const label = c('Label').jt`Enter the password for key with fingerprint: ${fingerprintCode}`;

    const [password, setPassword] = useState('');
    const [decrypting, setDecrypting] = useState(false);
    const [error, setError] = useState('');

    const container = (
        <>
            <Label htmlFor={id}>{label}</Label>
            <Field>
                <PasswordInput
                    id={id}
                    value={password}
                    error={error}
                    onChange={({ target: { value } }) => setPassword(value)}
                    autoFocus={true}
                    required
                />
            </Field>
        </>
    );

    const props = {
        title: c('Title').t`Decrypt key`,
        container,
        submit: (
            <PrimaryButton type="submit" disabled={!!decrypting}>
                {c('Action').t`Decrypt`}
            </PrimaryButton>
        ),
        onSubmit: async () => {
            try {
                setDecrypting(true);
                setError();

                const decryptedPrivateKey = await decrypt({ password, armoredPrivateKey });

                onSuccess(decryptedPrivateKey);
            } catch (e) {
                setError(e.message);
                setDecrypting(false);
            }
        },
        close: c('Action').t`Cancel`,
        onClose
    };

    return <RenderModal {...props}/>

};

DecryptFileKeyModal.propTypes = {
    fingerprint: PropTypes.string.isRequired,
    armoredPrivateKey: PropTypes.string.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default DecryptFileKeyModal;
