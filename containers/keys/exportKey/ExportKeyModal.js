import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Alert,
    Row,
    Field,
    Label,
    PasswordInput,
} from 'react-components';
import { encryptPrivateKey } from 'pmcrypto';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';

import { generateUID } from '../../../helpers/component';
import RenderModal from '../shared/RenderModal';

const ExportKeyModal = ({ filename, decryptedPrivateKey, onClose, onSuccess }) => {
    const [password, setPassword] = useState('');

    const id = generateUID('exportKey');

    const handleChange = ({ target }) => setPassword(target.value);

    const handleSubmit = async () => {
        const encryptedKey = await encryptPrivateKey(decryptedPrivateKey, password);
        const blob = new Blob([encryptedKey], { type: 'data:text/plain;charset=utf-8;' });
        downloadFile(blob, filename);
        onSuccess();
    };

    const title = c('Title').t`Export key`;

    const label = c('Label').t`Please enter a password to encrypt your private key with before exporting.`;
    const notificationText = c('Label').t`IMPORTANT: Downloading your private keys and sending them over or storing them on insecure media can jeopardise the security of your account!`;

    const container = (
        <>
            <Alert>{notificationText}</Alert>
            <Row>
                <Label htmlFor={id}>{label}</Label>
                <Field>
                    <PasswordInput id={id} value={password} onChange={handleChange} autoFocus={true} required/>
                </Field>
            </Row>
        </>
    );

    const props = {
        title,
        container,
        close: c('Action').t`Cancel`,
        submit: c('Action').t`Export`,
        onSubmit: handleSubmit
    };

    return <RenderModal onClose={onClose} close={close} {...props}/>;
};

ExportKeyModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    decryptedPrivateKey: PropTypes.object.isRequired,
    filename: PropTypes.string.isRequired
};
export default ExportKeyModal;
