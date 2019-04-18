import React, { useRef, useState } from 'react';
import { c } from 'ttag';
import { PrimaryButton, Button } from 'react-components';

import selectFilesReducer, {
    getInitialState as getInitialFilesState,
    onCancelDecrypt,
    onDecrypt, onFiles
} from '../shared/selectFilesReducer';
import DecryptKey, { decrypt } from '../shared/DecryptKey';
import SelectFiles from '../shared/SelectFiles';

const useDecryptOrUploadStep = ({ keySalts, keyInfo, keyData }) => {
    const selectRef = useRef();
    const [password, setPassword] = useState('');
    const [state, setState] = useState(getInitialFilesState());

    const dispatch = (action) => {
        const nextState = selectFilesReducer(state, action);
        setState(nextState);
        return nextState;
    };

    const decryptFileStep = ({ armoredKey, info: { fingerprints: [fingerprint] }}, onSuccess, onError) => {
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
        const container = <DecryptKey label={label} password={password} setPassword={setPassword}/>;

        return {
            title: c('Title').t`Decrypt key`,
            container,
            submit: c('Action').t`Decrypt`,
            onSubmit: () => handleDecrypt(),
            close: c('Action').t`Cancel`,
            onClose: () => dispatch(onCancelDecrypt(fingerprint))
        };
    };

    const decryptKeyStep = (onSuccess, onError) => {
        const fingerprint = keyInfo.fingerprint;
        const { KeySalt } = keySalts.find(({ ID }) => ID === keyData.ID) || {};

        const handleFiles = (files) => {
            setPassword('');

            if (files.length === 0) {
                return onError(c('Error').t`Invalid private key file`);
            }

            const keysWithFingerprint = files.filter(({ info }) => info.fingerprint === fingerprint);
            if (keysWithFingerprint.length === 0) {
                return onError(c('Error').t`Uploaded key does not match fingerprint`);
            }

            const nextState = dispatch(onFiles(files));
            if (nextState.done) {
                onSuccess(nextState.keys[0].decryptedPrivateKey);
            }
        };

        const handleDecryptKey = async () => {
            try {
                setPassword('');
                const decryptedPrivateKey = await decrypt({
                    armoredKey: keyData.PrivateKey,
                    keySalt: KeySalt,
                    password
                });
                onSuccess(decryptedPrivateKey);
            } catch (e) {
                onError(c('Error').t`Invalid decryption password`);
            }
        };

        const label = c('Label').t`Enter your previous password from before your account was reset:`;
        const container = (
            <>
                <DecryptKey label={label} password={password} setPassword={setPassword}/>
                <SelectFiles ref={selectRef} onFiles={handleFiles} autoClick={false}/>
            </>
        );

        const submit = (
            <>
                <Button onClick={() => selectRef.current.click()}>
                    {c('Action').t`Upload backup key`}
                </Button>
                <PrimaryButton type="submit">
                    {c('Action').t`Decrypt`}
                </PrimaryButton>
            </>
        );

        return {
            title: c('Title').t`Reactivate key`,
            container,
            submit,
            onSubmit: handleDecryptKey
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
        return decryptKeyStep(onSuccess, onError);
    };
};

export default useDecryptOrUploadStep;
