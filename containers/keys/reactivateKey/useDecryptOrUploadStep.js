import React, { useRef, useState, useReducer } from 'react';
import { c } from 'ttag';
import { PrimaryButton, Button } from 'react-components';

import selectFilesReducer, {
    getInitialState as getInitialFilesState,
    cancelDecrypt,
    keyDecrypted,
    keyDecryptedMain,
    keyError,
    filesSelected
} from '../shared/selectFilesReducer';
import DecryptKey, { decrypt } from '../shared/DecryptKey';
import SelectFiles from '../shared/SelectFiles';

const useDecryptOrUploadStep = ({ keySalts, keyInfo, keyData }) => {
    const [password, setPassword] = useState('');
    const [state, dispatch] = useReducer(selectFilesReducer, getInitialFilesState());
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
        console.log('wtf', armoredPrivateKey, fingerprint)
        const label = c('Label').jt`Enter the password for key with fingerprint: ${<code>{fingerprint}</code>}`;
        const container = <DecryptKey label={label} password={password} setPassword={setPassword}/>;

        return {
            title: c('Title').t`Decrypt key`,
            container,
            submit: c('Action').t`Decrypt`,
            onSubmit: () => handleDecryptFile(armoredPrivateKey, fingerprint),
            close: c('Action').t`Cancel`,
            onClose: () => dispatch(cancelDecrypt(fingerprint))
        };
    };

    const handleDecryptKey = async () => {
        const { ID: keyID, PrivateKey: armoredPrivateKey } = keyData;
        const { KeySalt: keySalt } = keySalts.find(({ ID }) => ID === keyID) || {};
        setPassword('');

        try {
            const decryptedPrivateKey = await decrypt({
                armoredPrivateKey,
                keySalt,
                password
            });

            dispatch(keyDecryptedMain({ decryptedPrivateKey, info: keyInfo }));
        } catch (e) {
            dispatch(keyError(c('Error').t`Invalid decryption password`));
        }
    };

    const handleFiles = (files) => {
        const [keyFingerprint] = keyInfo.fingerprints;
        setPassword('');

        if (files.length === 0) {
            return dispatch(keyError(c('Error').t`Invalid private key file`));
        }

        const keysWithFingerprint = files.filter(({ info: { fingerprints: [fingerprint]} }) => fingerprint === keyFingerprint);
        if (keysWithFingerprint.length === 0) {
            return dispatch(keyError(c('Error').t`Uploaded key does not match fingerprint`));
        }

        dispatch(filesSelected(keysWithFingerprint));
    };

    const decryptKeyStep = () => {
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
        const { keyToDecryptIndex, keys, done, error } = state;

        if (done) {
            if (!notifiedRef.current) {
                notifiedRef.current = true;
                onSuccess(keys[0]);
            }

            return {
                title: c('Title').t`Loading`
            }
        }

        if (keyToDecryptIndex !== -1) {
            console.log(keys[keyToDecryptIndex], keyToDecryptIndex);
            return decryptFileStep(keys[keyToDecryptIndex]);
        }

        if (error) {
            onError(error);
        }

        return decryptKeyStep();
    };
};

export default useDecryptOrUploadStep;
