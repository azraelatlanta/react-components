import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Alert,
    Modal,
    ContentDivModal,
    Row,
    Label,
    PasswordInput,
    FooterModal,
    ResetButton,
    PrimaryButton
} from 'react-components';
import { encryptPrivateKey } from 'pmcrypto';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';

import { generateUID } from '../../../helpers/component';

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

    return (
        <Modal show={true} onClose={onClose} title={title} type="small">
            <ContentDivModal>
                <Alert>{notificationText}</Alert>
                <Row>
                    <Label htmlFor={id}>{label}</Label>
                    <PasswordInput id={id} value={password} onChange={handleChange} autoFocus={true} required/>
                </Row>
                <FooterModal>
                    <ResetButton>{c('Label').t`Cancel`}</ResetButton>
                    <PrimaryButton onClick={handleSubmit}>{c('Label').t`Export`}</PrimaryButton>
                </FooterModal>
            </ContentDivModal>
        </Modal>
    );
};

ExportKeyModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    decryptedPrivateKey: PropTypes.object.isRequired,
    filename: PropTypes.object.isRequired
};
export default ExportKeyModal;
