import React, { useRef, useState } from 'react';
import { c } from 'ttag';

import selectFilesReducer, {
    getInitialState,
    onCancelDecrypt,
    onDecrypt,
    onFiles
} from '../shared/selectFilesReducer';
import DecryptKey, { decrypt } from '../shared/DecryptKey';
import SelectFiles from '../shared/SelectFiles';

const useSelectAndDecryptStep = () => {
    const [state, setState] = useState(getInitialState());
    const [password, setPassword] = useState('');
    const selectRef = useRef();

    const dispatch = (action) => {
        const nextState = selectFilesReducer(state, action);
        setState(nextState);
        return nextState;
    };

    const decryptFileStep = ({ armoredKey, info: { fingerprint: [fingerprint] }}, onSuccess, onError) => {
        const handleDecrypt = async () => {
            try {
                setPassword('');
                const decryptedPrivateKey = await decrypt({ armoredKey, password });
                const nextState = dispatch(onDecrypt({ decryptedPrivateKey, fingerprint }));
                if (nextState.done) {
                    onSuccess(decryptedPrivateKey);
                }
            } catch (e) {
                onError(c('Error').t`Invalid decryption password`);
            }
        };

        const label = c('Label').jt`Enter the password for key with fingerprint: ${<code>{fingerprint}</code>}`;

        return {
            title: c('Title').t`Decrypt key`,
            container: <DecryptKey label={label} password={password} setPassword={setPassword}/>,
            submit: c('Action').t`Decrypt`,
            onSubmit: () => handleDecrypt(),
            close: c('Action').t`Cancel`,
            onClose: () => dispatch(onCancelDecrypt(fingerprint))
        };
    };

    const selectFilesStep = (onSuccess, onError) => {
        const handleFiles = (files) => {
            setPassword('');

            if (files.length === 0) {
                return onError(c('Error').t`Invalid private key file`);
            }

            const nextState = dispatch(onFiles(files));
            if (nextState.done) {
                onSuccess(nextState.keys[0].decryptedPrivateKey);
            }
        };

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
        const { keyToDecrypt, done } = state;
        if (done) {
            return {
                title: c('Title').t`Loading`
            }
        }
        if (keyToDecrypt) {
            return decryptFileStep(keyToDecrypt, onSuccess, onError);
        }
        return selectFilesStep(onSuccess, onError);
    };
};

export default useSelectAndDecryptStep;
