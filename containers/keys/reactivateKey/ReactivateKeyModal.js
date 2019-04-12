import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    useNotifications,
    Modal,
    Row,
    Label,
    PasswordInput,
    FooterModal,
    ResetButton,
    PrimaryButton,
    ContentDivModal,
    FileInput
} from 'react-components';
import { computeKeyPassword } from 'pm-srp';
import { decryptPrivateKey } from 'pmcrypto';

import { parseKeys } from '../importKeys/helper';
import DecryptKeyModal from '../importKeys/DecryptKeyModal';
import { generateUID } from '../../../helpers/component';

const ReactivateKeyModal = ({ keyInfo, keyData, keySalt, onClose, onSuccess }) => {
    const { fingerprint } = keyInfo;
    const { PrivateKey } = keyData;

    const fileRef = useRef();
    const { createNotification } = useNotifications();
    const [password, setPassword] = useState('');
    const [modal, setAction] = useState();

    const id = generateUID('reactivateKey');

    const handleChange = ({ target }) => {
        setPassword(target.value);
    };

    const handleDecrypt = async () => {
        try {
            // Optional KeySalt to support old key versions.
            const keyPassword = keySalt ? await computeKeyPassword(password, keySalt) : password;
            onSuccess(await decryptPrivateKey(PrivateKey, keyPassword));
        } catch (e) {
            createNotification({
                text: c('Error').t`Incorrect decryption password`,
                type: 'warning'
            });
        }
    };

    const handleFileImport = async ({ target }) => {
        const keys = await parseKeys(Array.from(target.files));

        // Reset it to allow to select the same file again.
        fileRef.current.value = '';

        if (!keys.length) {
            return createNotification({
                text: c('Error').t`Invalid private key file`,
                type: 'error'
            });
        }

        const key = keys.find(({ info: { fingerprint: keyFingerprint } }) => keyFingerprint === fingerprint);
        if (!key) {
            return createNotification({
                text: c('Error').t`Uploaded key does not match selected key`,
                type: 'error'
            });
        }

        const { decryptedPrivateKey, armoredKey, info } = key;

        if (decryptedPrivateKey) {
            return onSuccess(decryptedPrivateKey);
        }

        const modal = (
            <DecryptKeyModal
                title={c('Error').t`Private key password required`}
                armoredKey={armoredKey}
                fingerprint={info.fingerprint}
                onClose={() => setAction()}
                onSuccess={onSuccess}
            />
        );

        setAction(modal)
    };

    const title = c('Title').t`Reactivate key`;
    const passwordLabel = c('Label').t`Enter your previous password from before your account was reset:`;

    return (
        <>
            {modal}
            <Modal show={true} onClose={onClose} title={title} type="small">
                <ContentDivModal>
                    <Row>
                        <Label htmlFor={id}>{passwordLabel}</Label>
                        <PasswordInput id={id} value={password} onChange={handleChange} autoFocus={true} required />
                    </Row>
                    <FooterModal>
                        <ResetButton onClick={onClose}>{c('Label').t`Cancel`}</ResetButton>
                        <FileInput
                            accept='.txt,.asc'
                            ref={fileRef}
                            multiple={true}
                            onChange={handleFileImport}
                        >
                            {c('Select files').t`Upload backup key`}
                        </FileInput>
                        <PrimaryButton onClick={handleDecrypt}>{c('Label').t`Reactivate`}</PrimaryButton>
                    </FooterModal>
                </ContentDivModal>
            </Modal>
        </>
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
