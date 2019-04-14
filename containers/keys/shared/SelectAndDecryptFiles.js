import React, { forwardRef, useRef, useEffect, useState, useReducer, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { decryptPrivateKey } from 'pmcrypto';
import { c } from 'ttag';

import SelectFiles from './SelectFiles';
import DecryptKey from './DecryptKey';
import selectFilesReducer, { ACTIONS, DEFAULT_STATE } from './selectFilesReducer';

const SelectAndDecryptFiles = forwardRef(({ onSuccess, onError }, ref) => {
    const [{ done, keys, keyToDecrypt }, dispatch] = useReducer(selectFilesReducer, DEFAULT_STATE);
    const [keyPassword, setKeyPassword] = useState('');
    const fileRef = useRef();

    const handleError = (err) => onError(err);

    const handleSubmit = async ({ armoredKey, info: { fingerprint }}) => {
        try {
            setKeyPassword('');
            const decryptedPrivateKey = await decryptPrivateKey(armoredKey, keyPassword);
            dispatch({
                type: ACTIONS.KEY_DECRYPTED,
                payload: { fingerprint, decryptedPrivateKey }
            });
        } catch (e) {
            handleError(c('Error').t`Incorrect decryption password`);
        }
    };

    useImperativeHandle(ref, () => ({
        click: () => {
            if (keyToDecrypt) {
                return handleSubmit(keyToDecrypt);
            }
            if (fileRef.current) {
                return fileRef.current.click();
            }
        }
    }));

    useEffect(() => {
        if (done) {
            onSuccess(keys);
        }
    }, [onSuccess, done]);

    if (done) {
        return null;
    }

    if (keyToDecrypt) {
        const { armoredKey, info: { fingerprint }} = keyToDecrypt;
        return (
            <DecryptKey
                armoredKey={armoredKey}
                fingerprint={fingerprint}
                keyPassword={keyPassword}
                setKeyPassword={setKeyPassword}
            />
        )
    }

    const handleFileSuccess = (files) => {
        dispatch({ type: ACTIONS.FILES, payload: files });
    };

    return (<SelectFiles ref={fileRef} onSuccess={handleFileSuccess} onError={handleError}/>)
});

SelectAndDecryptFiles.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired
};
export default SelectAndDecryptFiles;
