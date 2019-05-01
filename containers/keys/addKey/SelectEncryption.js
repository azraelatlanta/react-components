import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Alert, Radio, Row, Label } from 'react-components';
import { ENCRYPTION_TYPES } from 'proton-shared/lib/constants';

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

const SelectEncryption = ({ encryptionType, setEncryptionType }) => {
    const highSecurity = <strong key="1">{c('encryption').t`High security`}</strong>;
    const highestSecurity = <strong key="2">{c('encryption').t`Highest security`}</strong>;
    const stateOfTheArt = <strong key="3">{c('encryption').t`State of the art`}</strong>;

    const radios = [
        {
            label: c('form option heading').jt`${highSecurity} RSA2048-bit (Older but faster)`,
            value: RSA2048
        },
        {
            label: c('form option heading').jt`${highestSecurity} RSA 4096-bit (Secure but slow)`,
            value: RSA4096
        },
        {
            label: c('form option heading').jt`${stateOfTheArt} X25519 (Modern, fastest, secure)`,
            value: X25519
        },
    ];

    const warning = getWarning(encryptionType);

    const infoText = c('info').t`You can generate a new encryption key if you think your previous key has been compromised.`;

    return (
        <>
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
        </>
    );
};

SelectEncryption.propTypes = {
    encryptionType: PropTypes.string.isRequired,
    setEncryptionType: PropTypes.func.isRequired
};

export default SelectEncryption;