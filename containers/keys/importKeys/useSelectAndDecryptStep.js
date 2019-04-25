import React, { useRef, useReducer, useState } from 'react';
import { c } from 'ttag';

import selectFilesReducer, {
    getInitialState,
    cancelDecrypt,
    keyDecrypted,
    filesSelected,
    keyError
} from '../shared/selectFilesReducer';
import DecryptKey, { decrypt } from '../shared/DecryptKey';
import SelectFiles from '../shared/SelectFiles';

const useSelectAndDecryptStep = () => {
    const [state, dispatch] = useReducer(selectFilesReducer, undefined, getInitialState);
    const [password, setPassword] = useState('');
    const selectRef = useRef();
    const notifiedRef = useRef();

    const handleDecryptFile = async (armoredPrivateKey, fingerprint) => {
        try {
            setPassword('');
            const decryptedPrivateKey = await decrypt({ armoredPrivateKey, password });
            dispatch(keyDecrypted({ decryptedPrivateKey, fingerprint }));
        } catch (e) {
            dispatch(keyError(c('Error').t`Invalid decryption password`));
        }
    };

    const decryptFileStep = ({ armoredPrivateKey, info: { fingerprints: [fingerprint] }}) => {
        const label = c('Label').jt`Enter the password for key with fingerprint: ${<code>{fingerprint}</code>}`;

        return {
            title: c('Title').t`Decrypt key`,
            container: <DecryptKey label={label} password={password} setPassword={setPassword}/>,
            submit: c('Action').t`Decrypt`,
            onSubmit: () => handleDecryptFile(armoredPrivateKey, fingerprint),
            close: c('Action').t`Cancel`,
            onClose: () => dispatch(cancelDecrypt(fingerprint))
        };
    };

    const handleFiles = (files) => {
        setPassword('');

        if (files.length === 0) {
            return dispatch(keyError(c('Error').t`Invalid private key file`));
        }

        dispatch(filesSelected(files));
    };

    const selectFilesStep = () => {
        const container = (
            <>
                {c('Label').t`Please select files to upload`}
                <SelectFiles ref={selectRef} onFiles={handleFiles} autoClick={true}/>
            </>
        );

        return {
            title: c('Title').t`Select files`,
            container,
            submit: c('Action').t`Select`,
            onSubmit: () => selectRef.current.click()
        }
    };

    return (onSuccess, onError) => {
        const { keyToDecryptIndex, keys, done, error } = state;

        if (done) {
            if (!notifiedRef.current) {
                notifiedRef.current = true;
                onSuccess(keys);
            }

            return {
                title: c('Title').t`Loading`
            }
        }

        if (keyToDecryptIndex !== -1) {
            return decryptFileStep(keys[keyToDecryptIndex]);
        }

        if (error) {
            onError(error);
        }

        return selectFilesStep();
    };
};

export default useSelectAndDecryptStep;
