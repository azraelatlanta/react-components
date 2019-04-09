import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useNotifications, Modal, ContentModal, Row, Label, Password, FooterModal, ResetButton, PrimaryButton } from 'react-components';
import { readFileAsString } from 'proton-shared/lib/helpers/fileHelper';
import { parseArmoredKeys, findArmoredKey } from 'proton-shared/lib/keys/keyImport';
import { decryptPrivateKey } from 'pmcrypto';
import { computeKeyPassword } from 'pm-srp';

import { generateUID } from '../../../helpers/component';

const PASSWORD_KEY_STATE = 1;
const BACKUP_KEY_STATE = 2;

const ReactivateKeyModal = ({ keyInfo, keyData, keySalt, onClose, onSuccess }) => {
    const { fingerprint } = keyInfo;
    const { PrivateKey } = keyData;

    const { createNotification } = useNotifications();

    const [state, setState] = useState(PASSWORD_KEY_STATE);
    const armoredKeyRef = useRef(PrivateKey);

    const [password, setPassword] = useState('');

    const id = generateUID('reactivateKey');
    const fileId = generateUID('reactiveKeyImport');

    const handleChange = ({ target }) => setPassword(target.value);

    const handleSubmit = async () => {
        try {
            // Optional KeySalt to support old key versions.
            const keyPassword = state === PASSWORD_KEY_STATE  && keySalt ? await computeKeyPassword(password, keySalt) : password;
            onSuccess(await decryptPrivateKey(armoredKeyRef.current, keyPassword));
        } catch (e) {
            createNotification({
                text: c('Error').t`Incorrect decryption password`,
                type: 'warning'
            });
        }
    };

    const handleFileImport = async ({ target }) => {
        const files = Array.from(target.files);
        const filesAsStrings = await Promise.all(files.map(readFileAsString)).catch(() => []);

        const armoredKeys = parseArmoredKeys(filesAsStrings.join('\n'));
        if (!armoredKeys.length) {
            createNotification({
                text: c('Error').t`Invalid private key file`,
                type: 'error'
            });
            return;
        }

        const { decryptedKey, encryptedKey } = await findArmoredKey(fingerprint, armoredKeys);
        if (!decryptedKey && !encryptedKey) {
            createNotification({
                text: c('Error').t`Uploaded key does not match selected key`,
                type: 'error'
            });
            return;
        }

        if (decryptedKey) {
            return onSuccess(decryptedKey);
        }

        armoredKeyRef.current = encryptedKey;
        setState(BACKUP_KEY_STATE)
    };

    const title = c('Title').t`Reactivate key`;
    const passwordLabel = c('Label').t`Enter your previous password from before your account was reset:`;
    const backupKeyLabel = c('Label').t`Enter the password for key with fingerprint:`;

    const label = state === PASSWORD_KEY_STATE ?
        passwordLabel :
        (<>{backupKeyLabel} <code>{fingerprint}</code></>);

    /* TODO: Fix custom file upload properly */
    const uploadBackupKey = state === PASSWORD_KEY_STATE ? (
            <label htmlFor={fileId}>
                <input id={fileId} type="file" onChange={handleFileImport} accept=".txt,.asc" multiple style={({display: 'none'})} />
                <span className='pm-button'>{c('Label').t`Upload backup key`}</span>
            </label>
    ) : null;

    return (
        <Modal show={true} onClose={onClose} title={title} type="small">
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <Row>
                    <Label htmlFor={id}>{label}</Label>
                    <Password id={id} value={password} onChange={handleChange} autoFocus={true} required />
                </Row>
                <FooterModal>
                    <ResetButton>{c('Label').t`Cancel`}</ResetButton>
                    { uploadBackupKey }
                    <PrimaryButton type="submit">{c('Label').t`Submit`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

ReactivateKeyModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    keyData: PropTypes.object.isRequired,
    keySalt: PropTypes.string,
    keyInfo: PropTypes.object.isRequired
};
export default ReactivateKeyModal;
