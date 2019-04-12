import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS, ENCRYPTION_TYPES } from 'proton-shared/lib/constants';
import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Alert, Radio, Modal, ContentModal, Row, Label, FooterModal, ResetButton, PrimaryButton } from 'react-components';

const { RSA2048, RSA4096, X25519 } = ENCRYPTION_TYPES;

const getWarning = (encryptionType) => {
    if (encryptionType !== RSA4096) {
        return;
    }
    const warningText = c('Warning').t`Generating RSA 4096-bit encryption keys may crash or freeze your browser. RSA 4096-bit keys are only recommended for high performance computers - not recommended for tablet and mobile devices.`;
    return (
        <Alert>
            {warningText}
        </Alert>
    );
};

const SelectEncryptionModal = ({ title, onSuccess, onClose }) => {
    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);

    const radios = [
        {
            label: c('form option heading').jt`${<strong>High security</strong>} RSA2048-bit (Older but faster)`,
            value: RSA2048
        },
        {
            label: c('form option heading').jt`${<strong>Highest security</strong>} RSA 4096-bit (Secure but slow)`,
            value: RSA4096
        },
        {
            label: c('form option heading').jt`${<strong>State-of-the-art</strong>} X25519 (Modern, fastest, secure)`,
            value: X25519
        },
    ];

    const handleSubmit = () => {
        onSuccess({ type: encryptionType, config: ENCRYPTION_CONFIGS[encryptionType] });
    };

    const warning = getWarning(encryptionType);

    const infoText = c('info').t`You can generate a new encryption key if you think your previous key has been compromised.`;

    return (
        <Modal show={true} onClose={onClose} title={title} type="small">
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <Alert>
                    {infoText}
                </Alert>
                {radios.map(({ label, value }, i) => {
                    const id = '' + i;
                    return (
                        <Row key={i}>
                            <Label htmlFor={id} >
                                <Radio
                                    id={id}
                                    checked={value === encryptionType}
                                    onChange={() => setEncryptionType(value)}/>
                                {label}
                            </Label>
                        </Row>
                    )}
                )}
                {warning}
                <FooterModal>
                    <ResetButton onClick={onClose}>{c('Label').t`Cancel`}</ResetButton>
                    <PrimaryButton type="submit">{c('Label').t`Generate keys`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

SelectEncryptionModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired
};

export default SelectEncryptionModal;
