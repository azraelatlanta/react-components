import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    useNotifications,
    Modal,
    ContentDivModal,
    Row,
    Label,
    Password,
    FooterModal,
    ResetButton,
    PrimaryButton
} from 'react-components';
import { decryptPrivateKey } from 'pmcrypto';

import { generateUID } from '../../../helpers/component';

const DecryptKeyModal = ({ title, fingerprint, armoredKey, onSuccess, onClose }) => {
    const { createNotification } = useNotifications();
    const [keyPassword, setKeyPassword] = useState('');

    const id = generateUID('decryptKey');

    const handleChange = ({ target }) => setKeyPassword(target.value);

    const handleSubmit = async () => {
        try {
            onSuccess(await decryptPrivateKey(armoredKey, keyPassword));
        } catch (e) {
            createNotification({
                text: c('Error').t`Incorrect decryption password`,
                type: 'warning'
            });
        }
    };

    return (
        <Modal show={true} onClose={onClose} title={title} type="small">
            <ContentDivModal>
                <Row>
                    <Label htmlFor={id}>{c('Label').t`Enter the password for key with fingerprint:`}
                        <code>{fingerprint}</code></Label>
                    <Password id={id} value={keyPassword} onChange={handleChange} autoFocus={true} required/>
                </Row>
                <FooterModal>
                    <ResetButton>{c('Label').t`Cancel`}</ResetButton>
                    <PrimaryButton onClick={handleSubmit}>{c('Label').t`Submit`}</PrimaryButton>
                </FooterModal>
            </ContentDivModal>
        </Modal>
    );
};

DecryptKeyModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    fingerprint: PropTypes.string.isRequired,
    armoredKey: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
};

export default DecryptKeyModal;
