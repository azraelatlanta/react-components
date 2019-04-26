import React, { useState, useRef, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import { useNotifications, PrimaryButton } from 'react-components';

import SelectKeyFiles from '../shared/SelectKeyFiles';
import SelectAddress from '../shared/SelectAddress';
import RenderModal from '../shared/RenderModal';
import ImportWarning from './ImportWarning';
import ImportKeysList, { STATUS, convertStatus } from './ImportKeysList';
import selectFilesReducer, { filesSelected, keyDecrypted, cancelDecrypt, getInitialState as getInitialFilesState } from '../shared/selectFilesReducer';
import DecryptFileKeyModal from '../shared/DecryptFileKeyModal';

const getInitialState = (Addresses) => {
    if (Addresses.length === 1) {
        const address = Addresses[0];
        return {
            address,
            step: 0
        }
    }
    return {
        step: 0
    }
};

const getState = (files = [], results = {}) => {
    return files.map(({ info }) => {
        const [fingerprint] = info.fingerprints;
        return {
            fingerprint,
            ...convertStatus(results[fingerprint], STATUS.LOADING)
        };
    })
};

const ImportKeyModalProcess = ({ Addresses, importKeys, onSuccess, onClose }) => {
    const [state, setState] = useState(getInitialState(Addresses));
    const { createNotification } = useNotifications();
    const [processing, setProcessing] = useState(false);
    const selectRef = useRef();
    const [modal, setModal] = useState();
    const [{ keyToDecrypt, done, keys }, dispatch] = useReducer(selectFilesReducer, undefined, getInitialFilesState);

    const [addressIndex, setAddressIndex] = useState(0);
    const { step, address } = state;
    const [list, setList] = useState([]);

    const handleError = (text) => {
        createNotification({ type: 'error', text });
    };

    const handleDecryptedKeys = async (files = []) => {
        setProcessing(true);
        setList(getState(files, {}));
        setState({ ...state, step: 3 });

        const decryptedKeys = files.reduce((acc, { info, decryptedPrivateKey }) => {
            const [fingerprint] = info.fingerprints;
            acc[fingerprint] = decryptedPrivateKey;
            return acc;
        }, {});

        const results = await importKeys({ Address: address, decryptedKeys });

        setList(getState(files, results));
        setProcessing(false);
    };

    useEffect(() => {
        if (done) {
            handleDecryptedKeys(keys);
        }
    }, [done]);

    useEffect(() => {
        if (!keyToDecrypt) {
            return setModal()
        }

        const { info, armoredPrivateKey } = keyToDecrypt;
        const [fingerprint] = info.fingerprints;

        const modal = (
            <DecryptFileKeyModal
                key={fingerprint}
                fingerprint={fingerprint}
                armoredPrivateKey={armoredPrivateKey}
                onSuccess={(decryptedPrivateKey) => {
                    dispatch(keyDecrypted({ fingerprint, decryptedPrivateKey }));
                }}
                onClose={() => {
                    dispatch(cancelDecrypt(fingerprint));
                }}
            />
        );

        return setModal(modal);
    }, [keyToDecrypt]);


    const handleFiles = (files) => {
        if (files.length === 0) {
            return handleError(c('Error').t`Invalid private key file`);
        }
        dispatch(filesSelected(files));
    };

    const currentStep = [
        () => ({
            title: c('Title').t`Import key`,
            container: <ImportWarning/>,
            submit: c('Action').t`Yes`,
            onSubmit: () => setState({ ...state, step: address ? 1 : 1 }),
        }),
        () => ({
            title: c('Title').t`Select address`,
            container: <SelectAddress Addresses={Addresses} addressIndex={addressIndex} setAddressIndex={setAddressIndex} />,
            submit: c('Action').t`Select address`,
            onSubmit: () => setState({ ...state, address: Addresses[addressIndex], step: 2 })
        }),
        () => ({
            title: c('Title').t`Select files`,
            container: (
                <>
                    {c('Label').t`Please select files to upload`}
                    <SelectKeyFiles ref={selectRef} onFiles={handleFiles} multiple={true} autoClick={true}/>
                </>
            ),
            submit: c('Action').t`Select`,
            onSubmit: () => selectRef.current.click()
        }),
        () => {
            const n = list.length;
            return {
                title: c('Title').ngettext(msgid`Import key`, `Import ${n} keys`, n),
                container: (<ImportKeysList keys={list}/>),
                submit: (<PrimaryButton type="submit" disabled={processing}>{c('Action').t`Done`}</PrimaryButton>),
                onSubmit: onSuccess
            }
        }
    ][step]();

    const close = c('Action').t`Close`;

    return (
        <>
            <RenderModal onClose={onClose} close={close} {...currentStep}/>
            {modal}
        </>
    );
};

ImportKeyModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    importKeys: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired
};

export default ImportKeyModalProcess;
