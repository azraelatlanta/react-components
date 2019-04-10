import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SelectFilesInput, useNotifications, usePrompts } from 'react-components';
import { readFileAsString } from 'proton-shared/lib/helpers/fileHelper';
import { parseArmoredKeys } from 'proton-shared/lib/keys/keyImport';
import DecryptKeyModal from './DecryptKeyModal';
import { keyInfo as getKeyInfo, getKeys } from 'pmcrypto';

const SelectFilesModal = ({ onClose, onSuccess }) => {
    const { createNotification } = useNotifications();
    const { createPrompt } = usePrompts();

    const handleFileImport = async (files = []) => {
        const filesAsStrings = await Promise.all(files.map(readFileAsString)).catch(() => []);

        const armoredKeys = parseArmoredKeys(filesAsStrings.join('\n'));
        if (!armoredKeys.length) {
            createNotification({
                text: c('Error').t`Invalid private key file`,
                type: 'error'
            });
            return onClose();
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

    return (
        <SelectFilesInput
            accept='.txt,.asc'
            multiple={true}
            onSuccess={handleFileImport}
            onClose={onClose}
        />
    );
};

SelectFilesModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};
export default SelectFilesModal;
