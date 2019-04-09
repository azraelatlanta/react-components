import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert, Modal, ContentDivModal, FooterModal, ResetButton, PrimaryButton, useNotifications, usePrompts } from 'react-components';
import { readFileAsString } from 'proton-shared/lib/helpers/fileHelper';
import { parseArmoredKeys } from 'proton-shared/lib/keys/keyImport';
import DecryptKeyModal from './DecryptKeyModal';
import { keyInfo as getKeyInfo, getKeys } from 'pmcrypto';

import { generateUID } from '../../../helpers/component';

const ImportKeyModal = ({ onClose, onSuccess }) => {
    const { createNotification } = useNotifications();
    const { createPrompt } = usePrompts();

    const fileId = generateUID('importKey');

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

        const keys = [];
        for (let i = 0; i < armoredKeys.length; ++i) {
            const armoredKey = armoredKeys[i];

            try {
                const keyInfo = await getKeyInfo(armoredKey);
                const { decrypted, fingerprint } = keyInfo;

                const decryptedPrivateKey = decrypted ? await getKeys(armoredKey) :
                    await createPrompt((resolve, reject) => {
                        return (
                            <DecryptKeyModal
                                title={c('Error').t`Private key password required`}
                                armoredKey={armoredKey}
                                fingerprint={fingerprint}
                                onClose={reject}
                                onSuccess={resolve}
                            />
                        )
                    });

                keys.push({ decryptedPrivateKey, info: keyInfo })
            } catch (e) {
                // eslint-disable-next-line
            }
        }

        if (!keys.length) {
            return onClose();
        }

        return onSuccess(keys);
    };

    const title = c('Title').t`Import key`;
    const notificationText = c('Alert').t`Are you sure you want to import a private key? Importing an insecurely generated or leaked private key can harm the security of your emails.`;

    return (
        <Modal show={true} onClose={onClose} title={title} type='small'>
            <ContentDivModal>
                <Alert>{notificationText}</Alert>
                <FooterModal>
                    <ResetButton onClick={onClose}>{c('Label').t`Cancel`}</ResetButton>
                    <label htmlFor={fileId}>
                        <input id={fileId} type='file' onChange={handleFileImport} accept='.txt,.asc' multiple style={({display: 'none'})} />
                        <span className='pm-button--primary'>{c('Label').t`Confirm`}</span>
                    </label>
                </FooterModal>
            </ContentDivModal>
        </Modal>
    );
};

ImportKeyModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};
export default ImportKeyModal;
