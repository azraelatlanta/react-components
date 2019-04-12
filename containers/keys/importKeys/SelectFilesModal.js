import React, { useRef, useEffect, useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    useNotifications,
    Modal,
    ContentDivModal,
    Row,
    FooterModal,
    ResetButton,
    FileInput
} from 'react-components';

import { parseKeys } from './helper';
import DecryptKeyModal from './DecryptKeyModal';
import selectFilesReducer, { ACTIONS, DEFAULT_STATE } from './selectFilesReducer';

const getDecryptKeyModal = ({ armoredKey, info: { fingerprint }}, dispatch) => {
    return (
        <DecryptKeyModal
            title={c('Error').t`Private key password required`}
            armoredKey={armoredKey}
            fingerprint={fingerprint}
            onClose={() => {
                dispatch({ type: ACTIONS.KEY_CANCELLED, payload: fingerprint })
            }}
            onSuccess={(decryptedPrivateKey) => {
                dispatch({ type: ACTIONS.KEY_DECRYPTED, payload: { fingerprint, decryptedPrivateKey }});
            }}
        />
    )
};

const SelectFilesModal = ({ onClose, onSuccess }) => {
    const { createNotification } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [{ done, keys, keyToDecrypt }, dispatch] = useReducer(selectFilesReducer, DEFAULT_STATE);
    const fileRef = useRef();

    const handleFileImport = async ({ target }) => {
        setLoading(true);

        const keys = await parseKeys(Array.from(target.files));

        // Reset it to allow to select the same file again.
        fileRef.current.value = '';

        if (!keys.length) {
            createNotification({
                text: c('Error').t`Invalid private key file`,
                type: 'error'
            });
            return setLoading(false);
        }

        dispatch({
            type: ACTIONS.FILES,
            payload: keys
        });
    };

    useEffect(() => {
        if (loading && !keys.length) {
            setLoading(false);
        }
        if (done) {
            onSuccess(keys);
        }
    }, [onSuccess, keyToDecrypt, done, keys, loading]);

    useEffect(() => {
        fileRef.current.click();
    }, []);

    const title = c('Title').t`Select files to import`;

    return (
        <>
            {keyToDecrypt ? getDecryptKeyModal(keyToDecrypt, dispatch) : null}
            <Modal show={true} onClose={onClose} title={title} type="small">
                <ContentDivModal>
                    <Row>
                    </Row>
                    <FooterModal>
                        <ResetButton onClick={onClose}>{c('Label').t`Cancel`}</ResetButton>
                        <FileInput
                            accept='.txt,.asc'
                            disabled={loading}
                            ref={fileRef}
                            multiple={true}
                            onChange={handleFileImport}
                        >
                            {c('Select files').t`Upload`}
                        </FileInput>
                    </FooterModal>
                </ContentDivModal>
            </Modal>
        </>
    );
};

SelectFilesModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};
export default SelectFilesModal;
